import { beforeEach, describe, expect, it, vi } from 'vitest';

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
  Modality: { IMAGE: 'IMAGE' },
}));

import { editImage } from '../services/geminiService';

beforeEach(() => {
  generateContent.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('editImage', () => {
  it('sends the image + prompt to the image model and returns a data URI', async () => {
    generateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ inlineData: { data: 'AAAA', mimeType: 'image/png' } }] } }],
    });

    const result = await editImage('b64data', 'image/jpeg', 'add a hat');

    expect(result).toBe('data:image/png;base64,AAAA');
    const call = generateContent.mock.calls[0][0];
    expect(call.model).toBe('gemini-2.5-flash-image');
    expect(call.contents.parts[0].inlineData).toEqual({ data: 'b64data', mimeType: 'image/jpeg' });
    expect(call.contents.parts[1]).toEqual({ text: 'add a hat' });
    expect(call.config.responseModalities).toEqual(['IMAGE']);
  });

  it('skips text parts and finds the first image part', async () => {
    generateContent.mockResolvedValue({
      candidates: [
        { content: { parts: [{ text: 'here you go' }, { inlineData: { data: 'IMG', mimeType: 'image/webp' } }] } },
      ],
    });
    await expect(editImage('x', 'image/png', 'p')).resolves.toBe('data:image/webp;base64,IMG');
  });

  it('reports a non-STOP finish reason', async () => {
    generateContent.mockResolvedValue({ candidates: [{ finishReason: 'SAFETY', content: { parts: [] } }] });
    await expect(editImage('x', 'image/png', 'p')).rejects.toThrow('Failed to generate image: Generation failed: SAFETY.');
  });

  it('reports a prompt block reason when there are no candidates', async () => {
    generateContent.mockResolvedValue({ candidates: [], promptFeedback: { blockReason: 'PROHIBITED_CONTENT' } });
    await expect(editImage('x', 'image/png', 'p')).rejects.toThrow('Request blocked: PROHIBITED_CONTENT.');
  });

  it('reports a generic message when nothing was generated', async () => {
    generateContent.mockResolvedValue({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'no' }] } }] });
    await expect(editImage('x', 'image/png', 'p')).rejects.toThrow('No image content was generated');
  });

  it('wraps API errors', async () => {
    generateContent.mockRejectedValue(new Error('503 unavailable'));
    await expect(editImage('x', 'image/png', 'p')).rejects.toThrow('Failed to generate image: 503 unavailable');
  });

  it('wraps non-Error rejections with a fallback message', async () => {
    generateContent.mockRejectedValue('weird');
    await expect(editImage('x', 'image/png', 'p')).rejects.toThrow('unknown error');
  });

  it('fails fast without an API key and never calls the API', async () => {
    vi.stubEnv('API_KEY', '');
    await expect(editImage('x', 'image/png', 'p')).rejects.toThrow('API_KEY');
    expect(generateContent).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
