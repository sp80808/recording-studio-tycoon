import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SampleEditingGame } from '../SampleEditingGame';
import { useSound } from '@/hooks/useSound';

// Mock the useSound hook
jest.mock('@/hooks/useSound', () => ({
  useSound: jest.fn(() => ({
    playSound: jest.fn()
  }))
}));

describe('SampleEditingGame', () => {
  const mockOnComplete = jest.fn();
  const mockOnFail = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the game interface', () => {
    render(
      <SampleEditingGame
        type="sample_editing"
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Sample Editing Challenge')).toBeInTheDocument();
    expect(screen.getByText('Start Challenge')).toBeInTheDocument();
  });

  it('starts the game when clicking the start button', () => {
    render(
      <SampleEditingGame
        type="sample_editing"
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    const startButton = screen.getByText('Start Challenge');
    fireEvent.click(startButton);

    expect(screen.getByText('Time: 60s')).toBeInTheDocument();
    expect(screen.queryByText('Start Challenge')).not.toBeInTheDocument();
  });

  it('allows selecting and editing samples', () => {
    render(
      <SampleEditingGame
        type="sample_editing"
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    // Start the game
    fireEvent.click(screen.getByText('Start Challenge'));

    // Select a sample
    const sample = screen.getByText('Sample 1');
    fireEvent.click(sample);

    // Edit sample parameters
    const startInput = screen.getByLabelText('Start');
    const endInput = screen.getByLabelText('End');
    const pitchInput = screen.getByLabelText('Pitch');
    const volumeInput = screen.getByLabelText('Volume');

    fireEvent.change(startInput, { target: { value: '0.2' } });
    fireEvent.change(endInput, { target: { value: '0.8' } });
    fireEvent.change(pitchInput, { target: { value: '1.2' } });
    fireEvent.change(volumeInput, { target: { value: '0.7' } });

    expect(startInput).toHaveValue(0.2);
    expect(endInput).toHaveValue(0.8);
    expect(pitchInput).toHaveValue(1.2);
    expect(volumeInput).toHaveValue(0.7);
  });

  it('completes the game when timer runs out', () => {
    render(
      <SampleEditingGame
        type="sample_editing"
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    // Start the game
    fireEvent.click(screen.getByText('Start Challenge'));

    // Fast-forward timer
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(mockOnComplete).toHaveBeenCalled();
    expect(useSound().playSound).toHaveBeenCalledWith('complete');
  });

  it('plays sound effects on interactions', () => {
    render(
      <SampleEditingGame
        type="sample_editing"
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    // Start game
    fireEvent.click(screen.getByText('Start Challenge'));
    expect(useSound().playSound).toHaveBeenCalledWith('start');

    // Select sample
    const sample = screen.getByText('Sample 1');
    fireEvent.click(sample);
    expect(useSound().playSound).toHaveBeenCalledWith('select');
  });

  it('handles waveform interaction', () => {
    render(
      <SampleEditingGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
      />
    );

    fireEvent.click(screen.getByText('Start Editing'));

    const waveform = screen.getAllByLabelText('Waveform')[0];
    const rect = waveform.getBoundingClientRect();

    // Click near start point
    fireEvent.mouseDown(waveform, { clientX: rect.left + 10 });
    fireEvent.mouseMove(waveform, { clientX: rect.left + 20 });
    fireEvent.mouseUp(waveform);

    // Click near end point
    fireEvent.mouseDown(waveform, { clientX: rect.right - 10 });
    fireEvent.mouseMove(waveform, { clientX: rect.right - 20 });
    fireEvent.mouseUp(waveform);
  });
}); 