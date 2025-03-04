import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Board from '../components/Board';

describe('Board Component', () => {
  it('renders 9 squares', () => {
    const squares = Array(9).fill(null);
    render(<Board squares={squares} onClick={() => {}} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(9);
  });

  it('renders squares with correct values', () => {
    const squares = [null, 'X', 'O', 'X', null, 'O', null, null, 'X'];
    render(<Board squares={squares} onClick={() => {}} />);
    
    const buttons = screen.getAllByRole('button');
    
    expect(buttons[0]).toHaveTextContent('');
    expect(buttons[1]).toHaveTextContent('X');
    expect(buttons[2]).toHaveTextContent('O');
    expect(buttons[3]).toHaveTextContent('X');
    expect(buttons[4]).toHaveTextContent('');
    expect(buttons[5]).toHaveTextContent('O');
    expect(buttons[6]).toHaveTextContent('');
    expect(buttons[7]).toHaveTextContent('');
    expect(buttons[8]).toHaveTextContent('X');
  });

  it('calls onClick with the correct index when a square is clicked', () => {
    const handleClick = vi.fn();
    const squares = Array(9).fill(null);
    render(<Board squares={squares} onClick={handleClick} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[3]); // Click the 4th square (index 3)
    
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(3);
  });
});