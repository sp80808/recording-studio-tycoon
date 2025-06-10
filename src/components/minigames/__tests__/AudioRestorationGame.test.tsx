import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AudioRestorationGame } from '../AudioRestorationGame';
import { useSound } from '@/hooks/useSound';

// Mock the useSound hook
jest.mock('@/hooks/useSound', () => ({
  useSound: jest.fn()
}));

// Mock the toast
jest.mock('@/hooks/useToast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('AudioRestorationGame', () => {
  const mockPlaySound = jest.fn();
  const mockOnComplete = jest.fn();
  const mockOnFail = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSound as jest.Mock).mockReturnValue({ playSound: mockPlaySound });
  });

  it('renders the game interface', () => {
    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Audio Restoration')).toBeInTheDocument();
    expect(screen.getByText('Clean up and restore degraded audio recordings')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('starts the game when start button is clicked', () => {
    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start'));
    expect(mockPlaySound).toHaveBeenCalledWith('button_click');
    expect(screen.queryByText('Start')).not.toBeInTheDocument();
  });

  it('selects a region when clicked', () => {
    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    const regions = screen.getAllByRole('button', { name: /region/i });
    fireEvent.click(regions[0]);
    expect(mockPlaySound).toHaveBeenCalledWith('button_click');
  });

  it('selects a tool when clicked', () => {
    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    const tools = screen.getAllByRole('button', { name: /Noise Reduction|Click Removal|Hum Removal|De-reverb|Spectral Repair/i });
    fireEvent.click(tools[0]);
    expect(mockPlaySound).toHaveBeenCalledWith('button_click');
  });

  it('adjusts tool parameters when sliders are moved', () => {
    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '0.8' } });
    expect(mockPlaySound).toHaveBeenCalledWith('slider_move');
  });

  it('applies a tool to a selected region', async () => {
    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    // Select a region and tool
    const regions = screen.getAllByRole('button', { name: /region/i });
    const tools = screen.getAllByRole('button', { name: /Noise Reduction|Click Removal|Hum Removal|De-reverb|Spectral Repair/i });
    fireEvent.click(regions[0]);
    fireEvent.click(tools[0]);

    // Apply the tool
    const applyButton = screen.getByText('Apply Tool');
    fireEvent.click(applyButton);
    expect(mockPlaySound).toHaveBeenCalledWith('processing_start');

    // Wait for processing to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    expect(mockPlaySound).toHaveBeenCalledWith('processing_complete');
  });

  it('undoes the last action', () => {
    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    const undoButton = screen.getByText('Undo');
    expect(undoButton).toBeDisabled();

    // Apply a tool first
    const regions = screen.getAllByRole('button', { name: /region/i });
    const tools = screen.getAllByRole('button', { name: /Noise Reduction|Click Removal|Hum Removal|De-reverb|Spectral Repair/i });
    fireEvent.click(regions[0]);
    fireEvent.click(tools[0]);
    fireEvent.click(screen.getByText('Apply Tool'));

    // Now undo should be enabled
    expect(undoButton).not.toBeDisabled();
    fireEvent.click(undoButton);
    expect(mockPlaySound).toHaveBeenCalledWith('undo');
  });

  it('previews the audio', () => {
    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);
    expect(mockPlaySound).toHaveBeenCalledWith('preview_start');
  });

  it('completes the game when timer runs out', async () => {
    jest.useFakeTimers();

    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    // Start the game
    fireEvent.click(screen.getByText('Start'));

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(120000);
    });

    expect(mockOnComplete).toHaveBeenCalled();
    expect(mockPlaySound).toHaveBeenCalledWith('success');

    jest.useRealTimers();
  });

  it('disables controls when processing', async () => {
    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    // Select a region and tool
    const regions = screen.getAllByRole('button', { name: /region/i });
    const tools = screen.getAllByRole('button', { name: /Noise Reduction|Click Removal|Hum Removal|De-reverb|Spectral Repair/i });
    fireEvent.click(regions[0]);
    fireEvent.click(tools[0]);

    // Apply the tool
    const applyButton = screen.getByText('Apply Tool');
    fireEvent.click(applyButton);

    // Controls should be disabled during processing
    expect(applyButton).toBeDisabled();

    // Wait for processing to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    // Controls should be enabled again
    expect(applyButton).not.toBeDisabled();
  });

  it('plays sound effects on interactions', () => {
    render(
      <AudioRestorationGame
        difficulty={1}
        onComplete={mockOnComplete}
        onFail={mockOnFail}
        onClose={mockOnClose}
      />
    );

    // Start game
    fireEvent.click(screen.getByText('Start'));
    expect(mockPlaySound).toHaveBeenCalledWith('button_click');

    // Select region
    const regions = screen.getAllByRole('button', { name: /region/i });
    fireEvent.click(regions[0]);
    expect(mockPlaySound).toHaveBeenCalledWith('button_click');

    // Select tool
    const tools = screen.getAllByRole('button', { name: /Noise Reduction|Click Removal|Hum Removal|De-reverb|Spectral Repair/i });
    fireEvent.click(tools[0]);
    expect(mockPlaySound).toHaveBeenCalledWith('button_click');

    // Adjust parameter
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '0.8' } });
    expect(mockPlaySound).toHaveBeenCalledWith('slider_move');
  });
}); 