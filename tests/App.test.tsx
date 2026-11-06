import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/geminiService', () => ({ editImage: vi.fn() }));

import App from '../App';

describe('<App />', () => {
  it('renders the header, the editor and the footer', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Gemini Image Editor' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Result' })).toBeInTheDocument();
    expect(screen.getByText('Powered by Gemini 2.5 Flash Image')).toBeInTheDocument();
  });
});
