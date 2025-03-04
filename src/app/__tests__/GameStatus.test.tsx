import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameStatus from '../components/GameStatus';

describe('GameStatus Component', () => {
  it('displays the provided status text', () => {
    const statusText = 'Next player: X';
    render(<GameStatus status={statusText} />);
    
    expect(screen.getByText(statusText)).toBeInTheDocument();
  });

  it('displays winner status correctly', () => {
    const winnerText = 'Winner: O';
    render(<GameStatus status={winnerText} />);
    
    expect(screen.getByText(winnerText)).toBeInTheDocument();
  });

  it('displays draw status correctly', () => {
    const drawText = 'Draw!';
    render(<GameStatus status={drawText} />);
    
    expect(screen.getByText(drawText)).toBeInTheDocument();
  });
});