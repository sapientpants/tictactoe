import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Game from '../components/Game';

// Helper function to extract calculateWinner for unit testing
import { calculateWinner } from '../utils/gameUtils';

describe('Game Component', () => {
  it('renders an empty board initially', () => {
    render(<Game />);
    
    // The game should have 9 empty squares
    const buttons = screen.getAllByRole('button');
    // Find the 9 square buttons (excluding the reset button)
    const squareButtons = buttons.filter(button => !button.textContent?.includes('Restart'));
    
    expect(squareButtons).toHaveLength(9);
    squareButtons.forEach(button => {
      expect(button).toHaveTextContent('');
    });
  });

  it('shows the correct initial game status', () => {
    render(<Game />);
    expect(screen.getByText('Next player: X')).toBeInTheDocument();
  });

  it('places X and O alternately when clicking squares', () => {
    render(<Game />);
    
    const buttons = screen.getAllByRole('button');
    // Find the 9 square buttons (excluding the reset button)
    const squareButtons = buttons.filter(button => !button.textContent?.includes('Restart'));
    
    // First click - should place X
    fireEvent.click(squareButtons[0]);
    expect(squareButtons[0]).toHaveTextContent('X');
    expect(screen.getByText('Next player: O')).toBeInTheDocument();
    
    // Second click - should place O
    fireEvent.click(squareButtons[1]);
    expect(squareButtons[1]).toHaveTextContent('O');
    expect(screen.getByText('Next player: X')).toBeInTheDocument();
  });

  it('does not change a square that has already been clicked', () => {
    render(<Game />);
    
    const buttons = screen.getAllByRole('button');
    const squareButtons = buttons.filter(button => !button.textContent?.includes('Restart'));
    
    // First click on square 0
    fireEvent.click(squareButtons[0]);
    expect(squareButtons[0]).toHaveTextContent('X');
    
    // Try to click on the same square again
    fireEvent.click(squareButtons[0]);
    expect(squareButtons[0]).toHaveTextContent('X'); // Still X, not O
    expect(screen.getByText('Next player: O')).toBeInTheDocument(); // Turn hasn't changed
  });

  it('resets the game when Restart button is clicked', () => {
    render(<Game />);
    
    const buttons = screen.getAllByRole('button');
    const squareButtons = buttons.filter(button => !button.textContent?.includes('Restart'));
    const restartButton = screen.getByText('Restart Game');
    
    // Make some moves
    fireEvent.click(squareButtons[0]); // X
    fireEvent.click(squareButtons[1]); // O
    
    // Restart the game
    fireEvent.click(restartButton);
    
    // Board should be empty and turn should be X again
    squareButtons.forEach(button => {
      expect(button).toHaveTextContent('');
    });
    expect(screen.getByText('Next player: X')).toBeInTheDocument();
  });
});

// Unit tests for the game logic
describe('Game Logic - calculateWinner', () => {
  it('returns null when there is no winner', () => {
    const squares = [null, null, null, null, null, null, null, null, null];
    expect(calculateWinner(squares)).toBeNull();
    
    const inProgressSquares = ['X', 'O', null, 'X', 'O', null, null, null, null];
    expect(calculateWinner(inProgressSquares)).toBeNull();
  });

  it('detects horizontal wins', () => {
    // Top row win
    let squares = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
    expect(calculateWinner(squares)).toBe('X');
    
    // Middle row win
    squares = ['O', null, null, 'X', 'X', 'X', 'O', null, null];
    expect(calculateWinner(squares)).toBe('X');
    
    // Bottom row win
    squares = ['O', null, null, 'O', null, null, 'X', 'X', 'X'];
    expect(calculateWinner(squares)).toBe('X');
  });

  it('detects vertical wins', () => {
    // Left column win
    let squares = ['X', 'O', null, 'X', 'O', null, 'X', null, null];
    expect(calculateWinner(squares)).toBe('X');
    
    // Middle column win
    squares = ['O', 'X', null, null, 'X', null, null, 'X', 'O'];
    expect(calculateWinner(squares)).toBe('X');
    
    // Right column win
    squares = ['O', null, 'X', null, 'O', 'X', null, null, 'X'];
    expect(calculateWinner(squares)).toBe('X');
  });

  it('detects diagonal wins', () => {
    // Top-left to bottom-right diagonal
    let squares = ['X', null, 'O', null, 'X', 'O', null, null, 'X'];
    expect(calculateWinner(squares)).toBe('X');
    
    // Top-right to bottom-left diagonal
    squares = ['O', null, 'X', null, 'X', 'O', 'X', null, null];
    expect(calculateWinner(squares)).toBe('X');
  });
});