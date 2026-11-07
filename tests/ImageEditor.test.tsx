import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const editImage = vi.hoisted(() => vi.fn());
vi.mock('../services/geminiService', () => ({ editImage }));

import ImageEditor from '../components/ImageEditor';

beforeEach(() => {
  editImage.mockReset();
});

const png = () => new File([new Uint8Array([137, 80, 78, 71])], 'photo.png', { type: 'image/png' });

async function uploadAndPrompt(user: ReturnType<typeof userEvent.setup>, prompt = 'make it retro') {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, png());
  await screen.findByAltText('Original');
  if (prompt) await user.type(screen.getByLabelText(/Describe Your Edit/), prompt);
}

describe('<ImageEditor />', () => {
  it('starts empty with Generate disabled and no prompt box', () => {
    render(<ImageEditor />);
    expect(screen.getByText('Click to upload an image')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Image/ })).toBeDisabled();
    expect(screen.queryByLabelText(/Describe Your Edit/)).not.toBeInTheDocument();
    expect(screen.getByText('Your edited image will appear here')).toBeInTheDocument();
  });

  it('restricts uploads to png, jpeg and webp', () => {
    render(<ImageEditor />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('image/png, image/jpeg, image/webp');
  });

  it('previews the uploaded image and reveals the prompt box', async () => {
    const user = userEvent.setup();
    render(<ImageEditor />);
    await uploadAndPrompt(user, '');

    expect(screen.getByAltText('Original').getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    expect(screen.getByLabelText(/Describe Your Edit/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Image/ })).toBeDisabled(); // still no prompt
  });

  it('sends the base64 payload and mime type split from the data URL, then shows the result', async () => {
    editImage.mockResolvedValue('data:image/png;base64,RESULT');
    const user = userEvent.setup();
    render(<ImageEditor />);
    await uploadAndPrompt(user);

    await user.click(screen.getByRole('button', { name: /Generate Image/ }));

    expect(await screen.findByAltText('Generated')).toHaveAttribute('src', 'data:image/png;base64,RESULT');
    const [base64, mime, prompt] = editImage.mock.calls[0];
    expect(mime).toBe('image/png');
    expect(prompt).toBe('make it retro');
    expect(atob(base64).length).toBe(4);
    expect(screen.getByRole('button', { name: /Download Image/ })).toBeInTheDocument();
  });

  it('shows the loading state while generating', async () => {
    let resolve!: (v: string) => void;
    editImage.mockReturnValue(new Promise<string>((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<ImageEditor />);
    await uploadAndPrompt(user);

    await user.click(screen.getByRole('button', { name: /Generate Image/ }));

    expect(await screen.findByText('Editing your image...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generating/ })).toBeDisabled();
    resolve('data:image/png;base64,Z');
    expect(await screen.findByAltText('Generated')).toBeInTheDocument();
  });

  it('shows the error from the service and no download button', async () => {
    editImage.mockRejectedValue(new Error('Failed to generate image: SAFETY'));
    const user = userEvent.setup();
    render(<ImageEditor />);
    await uploadAndPrompt(user);

    await user.click(screen.getByRole('button', { name: /Generate Image/ }));

    expect(await screen.findByText('Generation Failed')).toBeInTheDocument();
    expect(screen.getByText('Failed to generate image: SAFETY')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download Image/ })).not.toBeInTheDocument();
  });

  it('clears a previous result when a new image is uploaded', async () => {
    editImage.mockResolvedValue('data:image/png;base64,RESULT');
    const user = userEvent.setup();
    render(<ImageEditor />);
    await uploadAndPrompt(user);
    await user.click(screen.getByRole('button', { name: /Generate Image/ }));
    await screen.findByAltText('Generated');

    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, png());

    await waitFor(() => expect(screen.queryByAltText('Generated')).not.toBeInTheDocument());
  });

  it('downloads the result through a temporary link', async () => {
    editImage.mockResolvedValue('data:image/png;base64,RESULT');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<ImageEditor />);
    await uploadAndPrompt(user);
    await user.click(screen.getByRole('button', { name: /Generate Image/ }));
    await user.click(await screen.findByRole('button', { name: /Download Image/ }));

    expect(click).toHaveBeenCalledTimes(1);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.href).toBe('data:image/png;base64,RESULT');
    expect(link.download).toMatch(/^edited-image-\d+\.png$/);
    expect(document.querySelector('a[download]')).toBeNull(); // cleaned up
  });
});
