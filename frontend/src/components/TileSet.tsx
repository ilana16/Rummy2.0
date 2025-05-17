import React from 'react';
import styled from 'styled-components';
import { TileSet as TileSetType } from '../utils/gameLogic';
import Tile from './Tile';

interface TileSetProps {
  tileSet: TileSetType;
  onTileClick?: (tileId: string) => void;
}

const SetContainer = styled.div<{ type: string }>`
  display: flex;
  flex-direction: row;
  background-color: ${props => props.type === 'run' ? '#e8f5e9' : '#e3f2fd'};
  border-radius: 10px;
  padding: 10px;
  margin: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  min-height: 110px;
  align-items: center;
`;

const TileSet: React.FC<TileSetProps> = ({ tileSet, onTileClick }) => {
  return (
    <SetContainer type={tileSet.type}>
      {tileSet.tiles.map(tile => (
        <Tile 
          key={tile.id} 
          tile={tile} 
          onClick={() => onTileClick && onTileClick(tile.id)}
        />
      ))}
    </SetContainer>
  );
};

export default TileSet;
