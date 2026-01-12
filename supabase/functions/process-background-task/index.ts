import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper to update task status
async function updateTask(taskId: string, updates: {
  status?: string;
  progress_message?: string;
  progress_percent?: number;
  book_id?: string;
  error_message?: string;
}) {
  const { error } = await supabase
    .from("book_generation_tasks")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  
  if (error) {
    console.error("Failed to update task:", error);
  }
}

// Background processing function
async function processTask(taskId: string, inputData: any) {
  console.log(`Processing task ${taskId}...`);
  
  try {
    // Step 1: Analyzing
    await updateTask(taskId, {
      status: "analyzing",
      progress_message: "Çizim analiz ediliyor...",
      progress_percent: 10,
    });

    // Call generate-story-from-drawing function
    const storyResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-story-from-drawing`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64: inputData.imageBase64,
        language: inputData.language || "tr",
        pageCount: inputData.pageCount || 5,
        model: inputData.model || "gemini-3-pro-preview",
        userDescription: inputData.userDescription,
        profile: inputData.profile,
      }),
    });

    if (!storyResponse.ok) {
      const errorText = await storyResponse.text();
      throw new Error(`Story generation failed: ${errorText}`);
    }

    const storyData = await storyResponse.json();
    console.log("Story generated:", storyData.title);

    // Step 2: Generating images
    await updateTask(taskId, {
      status: "generating_images",
      progress_message: "Görseller oluşturuluyor...",
      progress_percent: 40,
    });

    // Prepare pages for image generation
    const pagesForImages = storyData.pages.map((page: any) => ({
      character: page.character,
      emoji: page.emoji,
      description: page.description,
    }));

    const imageResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-book-images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pages: pagesForImages,
        theme: storyData.theme || storyData.title,
        imageModel: inputData.imageModel || "dall-e-3",
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      throw new Error(`Image generation failed: ${errorText}`);
    }

    const imageData = await imageResponse.json();
    console.log("Images generated:", imageData.images?.length);

    // Update progress
    await updateTask(taskId, {
      progress_message: "Kitap kaydediliyor...",
      progress_percent: 90,
    });

    // Create the book object
    const bookId = `book-${Date.now()}`;
    const pagesWithImages = storyData.pages.map((page: any, index: number) => ({
      ...page,
      backgroundImage: imageData.images?.[index] || null,
    }));

    // Save book to database
    const { error: bookError } = await supabase
      .from("books")
      .insert({
        id: bookId,
        user_id: inputData.userId,
        child_id: inputData.profile?.childId || null,
        title: storyData.title,
        theme: storyData.theme || storyData.title,
        cover_emoji: storyData.pages[0]?.emoji || "📚",
        cover_image: pagesWithImages[0]?.backgroundImage || null,
        category: inputData.category || "other",
        is_from_drawing: true,
      });

    if (bookError) {
      throw new Error(`Failed to save book: ${bookError.message}`);
    }

    // Save book pages
    const pagesToInsert = pagesWithImages.map((page: any, index: number) => ({
      book_id: bookId,
      page_number: index + 1,
      title: page.title,
      description: page.description,
      character: page.character,
      emoji: page.emoji,
      sound: page.sound || "pop",
      background_image: page.backgroundImage,
      text_position: page.textPosition || "bottom",
    }));

    const { error: pagesError } = await supabase
      .from("book_pages")
      .insert(pagesToInsert);

    if (pagesError) {
      throw new Error(`Failed to save pages: ${pagesError.message}`);
    }

    // Mark as completed
    await updateTask(taskId, {
      status: "completed",
      progress_message: "Hikaye hazır!",
      progress_percent: 100,
      book_id: bookId,
    });

    console.log(`Task ${taskId} completed successfully! Book ID: ${bookId}`);

  } catch (error) {
    console.error(`Task ${taskId} failed:`, error);
    await updateTask(taskId, {
      status: "failed",
      progress_message: "Hata oluştu",
      progress_percent: 0,
      error_message: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId } = await req.json();

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "taskId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the task
    const { data: task, error: taskError } = await supabase
      .from("book_generation_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: "Task not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process the task - this will run and complete before returning
    // For true background processing, we process synchronously but the client doesn't wait
    await processTask(taskId, task.input_data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Task completed",
        taskId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
