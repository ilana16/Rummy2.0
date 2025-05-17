import React, { useState } from 'react';
import styled from 'styled-components';

interface GameOptionsProps {
  onSave: (options: GameOptions) => void;
  initialOptions?: GameOptions;
}

export interface GameOptions {
  maxPlayers: number;
  initialMeldPoints: number;
  timePerTurn: number | null; // null means no time limit
  enableSoundEffects: boolean;
  enableHapticFeedback: boolean;
}

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const OptionGroup = styled.div`
  margin-bottom: 20px;
`;

const OptionTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 10px;
`;

const OptionDescription = styled.p`
  margin-top: 0;
  margin-bottom: 15px;
  color: #757575;
  font-size: 14px;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const RadioButton = styled.label<{ selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background-color: ${props => props.selected ? '#4caf50' : '#f5f5f5'};
  color: ${props => props.selected ? 'white' : '#333'};
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.selected ? '#388e3c' : '#e0e0e0'};
  }
  
  input {
    display: none;
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: #4caf50;
  }
  
  input:checked + span:before {
    transform: translateX(26px);
  }
`;

const ToggleOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const ToggleLabel = styled.div`
  font-weight: bold;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const SaveButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s;

  &:hover {
    background-color: #388e3c;
  }
`;

const GameOptions: React.FC<GameOptionsProps> = ({ onSave, initialOptions }) => {
  const [options, setOptions] = useState<GameOptions>(initialOptions || {
    maxPlayers: 4,
    initialMeldPoints: 30,
    timePerTurn: null,
    enableSoundEffects: true,
    enableHapticFeedback: true
  });
  
  const handleSave = () => {
    onSave(options);
  };
  
  return (
    <OptionsContainer>
      <h2>Game Options</h2>
      
      <OptionGroup>
        <OptionTitle>Number of Players</OptionTitle>
        <OptionDescription>
          Select the maximum number of players allowed in the game.
        </OptionDescription>
        <RadioGroup>
          <RadioButton selected={options.maxPlayers === 2}>
            <input 
              type="radio" 
              name="maxPlayers" 
              checked={options.maxPlayers === 2}
              onChange={() => setOptions({...options, maxPlayers: 2})}
            />
            2 Players
          </RadioButton>
          <RadioButton selected={options.maxPlayers === 3}>
            <input 
              type="radio" 
              name="maxPlayers" 
              checked={options.maxPlayers === 3}
              onChange={() => setOptions({...options, maxPlayers: 3})}
            />
            3 Players
          </RadioButton>
          <RadioButton selected={options.maxPlayers === 4}>
            <input 
              type="radio" 
              name="maxPlayers" 
              checked={options.maxPlayers === 4}
              onChange={() => setOptions({...options, maxPlayers: 4})}
            />
            4 Players
          </RadioButton>
        </RadioGroup>
      </OptionGroup>
      
      <OptionGroup>
        <OptionTitle>Initial Meld Points</OptionTitle>
        <OptionDescription>
          Points required for the first meld in the game.
        </OptionDescription>
        <RadioGroup>
          <RadioButton selected={options.initialMeldPoints === 20}>
            <input 
              type="radio" 
              name="initialMeldPoints" 
              checked={options.initialMeldPoints === 20}
              onChange={() => setOptions({...options, initialMeldPoints: 20})}
            />
            20 Points (Easy)
          </RadioButton>
          <RadioButton selected={options.initialMeldPoints === 30}>
            <input 
              type="radio" 
              name="initialMeldPoints" 
              checked={options.initialMeldPoints === 30}
              onChange={() => setOptions({...options, initialMeldPoints: 30})}
            />
            30 Points (Standard)
          </RadioButton>
          <RadioButton selected={options.initialMeldPoints === 40}>
            <input 
              type="radio" 
              name="initialMeldPoints" 
              checked={options.initialMeldPoints === 40}
              onChange={() => setOptions({...options, initialMeldPoints: 40})}
            />
            40 Points (Hard)
          </RadioButton>
        </RadioGroup>
      </OptionGroup>
      
      <OptionGroup>
        <OptionTitle>Time Per Turn</OptionTitle>
        <OptionDescription>
          Set a time limit for each player's turn.
        </OptionDescription>
        <RadioGroup>
          <RadioButton selected={options.timePerTurn === null}>
            <input 
              type="radio" 
              name="timePerTurn" 
              checked={options.timePerTurn === null}
              onChange={() => setOptions({...options, timePerTurn: null})}
            />
            No Limit
          </RadioButton>
          <RadioButton selected={options.timePerTurn === 60}>
            <input 
              type="radio" 
              name="timePerTurn" 
              checked={options.timePerTurn === 60}
              onChange={() => setOptions({...options, timePerTurn: 60})}
            />
            60 Seconds
          </RadioButton>
          <RadioButton selected={options.timePerTurn === 30}>
            <input 
              type="radio" 
              name="timePerTurn" 
              checked={options.timePerTurn === 30}
              onChange={() => setOptions({...options, timePerTurn: 30})}
            />
            30 Seconds
          </RadioButton>
        </RadioGroup>
      </OptionGroup>
      
      <OptionGroup>
        <OptionTitle>Sound & Feedback</OptionTitle>
        <OptionDescription>
          Configure sound effects and haptic feedback.
        </OptionDescription>
        
        <ToggleOption>
          <ToggleLabel>Sound Effects</ToggleLabel>
          <ToggleSwitch>
            <input 
              type="checkbox" 
              checked={options.enableSoundEffects}
              onChange={() => setOptions({...options, enableSoundEffects: !options.enableSoundEffects})}
            />
            <span></span>
          </ToggleSwitch>
        </ToggleOption>
        
        <ToggleOption>
          <ToggleLabel>Haptic Feedback (Mobile)</ToggleLabel>
          <ToggleSwitch>
            <input 
              type="checkbox" 
              checked={options.enableHapticFeedback}
              onChange={() => setOptions({...options, enableHapticFeedback: !options.enableHapticFeedback})}
            />
            <span></span>
          </ToggleSwitch>
        </ToggleOption>
      </OptionGroup>
      
      <ButtonContainer>
        <SaveButton onClick={handleSave}>
          Save Options
        </SaveButton>
      </ButtonContainer>
    </OptionsContainer>
  );
};

export default GameOptions;
