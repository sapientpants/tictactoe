import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Square from '../components/Square';

describe('Square Component', () => {
  it('renders with correct value', () => {
    render(<Square value="X" onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveTextContent('X');
  });

  it('renders empty when value is null', () => {
    render(<Square value={null} onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveTextContent('');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Square value={null} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});