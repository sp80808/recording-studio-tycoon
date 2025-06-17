import pandas as pd
import sys

def get_contextual_prompts(context_query: str, csv_path: str = 'awesome-chatgpt-prompts.csv', top_n: int = 5):
    """
    Loads prompts from a CSV and returns contextually relevant prompts.

    Args:
        context_query (str): The string representing the current context or task.
        csv_path (str): The path to the awesome-chatgpt-prompts.csv file.
        top_n (int): The maximum number of relevant prompts to return.

    Returns:
        list: A list of dictionaries, each containing 'act' and 'prompt' of relevant entries.
    """
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print(f"Error: Dataset CSV not found at {csv_path}. Please download it from "
              "https://huggingface.co/datasets/fka/awesome-chatgpt-prompts "
              "and place it in the specified path.", file=sys.stderr)
        return []

    context_query_lower = context_query.lower()
    
    # Calculate a simple relevance score based on keyword matching
    # You could extend this with more sophisticated NLP techniques (e.g., TF-IDF, embeddings)
    df['relevance'] = df.apply(
        lambda row: (context_query_lower in row['act'].lower()) * 2 + 
                    (context_query_lower in row['prompt'].lower()), 
        axis=1
    )
    
    # Filter out non-relevant prompts and sort by relevance
    relevant_prompts = df[df['relevance'] > 0].sort_values(by='relevance', ascending=False)
    
    return relevant_prompts[['act', 'prompt']].head(top_n).to_dict(orient='records')

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python contextual_prompts.py '<your context query>'", file=sys.stderr)
        sys.exit(1)

    user_context = sys.argv[1]
    csv_file = 'awesome-chatgpt-prompts.csv' # Assuming the CSV is in the same directory as the script or easily accessible

    # Attempt to find the CSV in the current directory, or a common 'data' folder
    # In a real scenario, you might prompt the user for the path or use a config.
    try:
        # Check current working directory first
        pd.read_csv(csv_file)
    except FileNotFoundError:
        # If not found, try common data directories relative to the workspace root
        # Adjust this path based on where you decide to store the dataset
        csv_file = 'data/awesome-chatgpt-prompts.csv' 
        try:
            pd.read_csv(csv_file)
        except FileNotFoundError:
            # Last resort, try to find in the docs/cline_docs if that's where similar files are stored
            csv_file = 'docs/cline_docs/awesome-chatgpt-prompts.csv'
            try:
                pd.read_csv(csv_file)
            except FileNotFoundError:
                print(f"Could not find '{csv_file}' in common locations. Please ensure the CSV is accessible and try again.", file=sys.stderr)
                sys.exit(1)

    print(f"Searching for prompts related to: '{user_context}'...")
    prompts = get_contextual_prompts(user_context, csv_path=csv_file)

    if prompts:
        print("\n--- Relevant Prompts ---")
        for i, p in enumerate(prompts):
            print(f"\n{i+1}. Act: {p['act']}\n   Prompt: {p['prompt']}\n")
    else:
        print("No relevant prompts found for your query.") 