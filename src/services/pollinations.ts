export async function generateBandName(): Promise<string> {
  const response = await fetch('/api/pollinations/band-name');
  if (!response.ok) {
    throw new Error(`Error generating band name: ${response.statusText}`);
  }
  const data: { name: string } = await response.json();
  return data.name;
}

export async function generateAlbumArt(prompt: string): Promise<string> {
  try {
    const response = await fetch(`/api/pollinations/album-art?prompt=${encodeURIComponent(prompt)}`);
    if (!response.ok) {
      throw new Error(`Error generating album art: ${response.statusText}`);
    }
    const data: { url: string } = await response.json();
    return data.url;
  } catch (err) {
    console.warn('generateAlbumArt failed, using fallback', err);
    // Fallback: return placeholder artwork
    return '/placeholder.svg';
  }
}

export async function generateReview(projectName: string): Promise<string> {
  try {
    const prompt = `Write a concise in-universe review of the album titled '${projectName}', including critical feedback and praise.`;
    const response = await fetch(`/api/pollinations/text?prompt=${encodeURIComponent(prompt)}`);
    if (!response.ok) {
      throw new Error(`Error generating review: ${response.statusText}`);
    }
    const data: { text: string } = await response.json();
    return data.text;
  } catch (err) {
    console.warn('generateReview failed, using fallback', err);
    // Fallback: generate simple contextual review
    const positives = [
      'captivating melodies',
      'innovative production',
      'strong lyrical themes',
      'compelling performances'
    ];
    const negatives = [
      'occasionally feels repetitive',
      'could use more dynamic range',
      'some tracks lack cohesion',
      'lyrics sometimes fall flat'
    ];
    const pos = positives[Math.floor(Math.random() * positives.length)];
    const neg = negatives[Math.floor(Math.random() * negatives.length)];
    return `The album "${projectName}" delivers ${pos}, though it ${neg}.`;
  }
}
