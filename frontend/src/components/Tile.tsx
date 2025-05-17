import React from 'react';
import styled from 'styled-components';
import { Tile as TileType } from '../utils/gameLogic';

interface TileProps {
  tile: TileType;
  onClick?: () => void;
  isDragging?: boolean;
  isSelected?: boolean;
}

const TileContainer = styled.div<{
  color: string;
  isJoker: boolean;
  isDragging?: boolean;
  isSelected?: boolean;
}>`
  width: 60px;
  height: 90px;
  border-radius: 8px;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 5px;
  cursor: pointer;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: ${props => (props.isDragging ? 'scale(1.05)' : 'scale(1)')};
  border: ${props => (props.isSelected ? '3px solid #ffc107' : '1px solid #ccc')};
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 7px;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
    pointer-events: none;
  }
`;

const TileNumber = styled.div<{ color: string; isJoker: boolean }>`
  font-size: 32px;
  font-weight: bold;
  color: ${props => props.color};
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  ${props => props.isJoker && `
    background: linear-gradient(45deg, red, blue, yellow, black);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  `}
`;

const JokerStar = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 40px;
  background: linear-gradient(45deg, red, blue, yellow, black);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const getColorCode = (color: string): string => {
  switch (color) {
    case 'red':
      return '#ff0000';
    case 'blue':
      return '#0000ff';
    case 'yellow':
      return '#ffd700';
    case 'black':
      return '#000000';
    default:
      return '#000000';
  }
};

const Tile: React.FC<TileProps> = ({ tile, onClick, isDragging, isSelected }) => {
  const colorCode = getColorCode(tile.color);
  
  return (
    <TileContainer 
      color={colorCode}
      isJoker={tile.isJoker}
      onClick={onClick}
      isDragging={isDragging}
      isSelected={isSelected}
    >
      {tile.isJoker ? (
        <JokerStar>★</JokerStar>
      ) : (
        <TileNumber color={colorCode} isJoker={false}>
          {tile.value}
        </TileNumber>
      )}
    </TileContainer>
  );
};

export default Tile;
