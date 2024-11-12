import { getLlama } from "node-llama-cpp";
import path from "path";
import 'dotenv/config';   
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

(async () => {
    try {
        
        const llama = await getLlama();
        const model = await llama.loadModel({
            //need to download the model from the Llama website it is nearly 4.5GB
            modelPath: path.join("./llama.cpp/models", "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf")  
        });
        const context = await model.createEmbeddingContext();
        const embedDocuments = async (documents) => {
            const embeddings = [];

        
            await Promise.all(
                documents.map(async (document) => {
                    const embedding = await context.getEmbeddingFor(document);  
                    embeddings.push({ content: document, embedding: embedding.vector });  
                    console.debug(`${embeddings.length}/${documents.length} documents embedded`);  
                })
            );

            return embeddings; 
        };

        
        const handbookChunks = ["Document chunk 1", "Document chunk 2"]; 
        const documentEmbeddings = await embedDocuments(handbookChunks);
        const insertEmbeddings = async (embeddings) => {
            
            const { error } = await supabase
                .from('handbook_docs')
                .insert(embeddings);  

           
            if (error) {
                console.error('Error inserting embeddings:', error);
            } else {
                console.log('Embeddings inserted successfully!');
            }
        };

        
        await insertEmbeddings(documentEmbeddings);

    } catch (error) {
        console.error('An error occurred:', error);
    }
})();
