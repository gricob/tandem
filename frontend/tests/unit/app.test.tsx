import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/providers';

describe('App', () => {
  it('renders the Tandem landing page', async () => {
    render(<App />);

    expect(await screen.findByText('Tandem')).toBeInTheDocument();
  });
});
