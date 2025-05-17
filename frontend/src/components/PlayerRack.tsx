import React from 'react';
import styled from 'styled-components';
import { Tile as TileType } from '../utils/gameLogic';
import Tile from './Tile';

interface PlayerRackProps {
  tiles: TileType[];
  onTileClick?: (tileId: string) => void;
  selectedTileIds?: string[];
}

const RackContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  background-color: #8b5a2b;
  border-radius: 10px 10px 0 0;
  padding: 15px;
  margin-top: auto;
  width: 100%;
  max-width: 1200px;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.2);
  min-height: 120px;
`;

const TileWrapper = styled.div`
  margin: 5px;
`;

const PlayerRack: React.FC<PlayerRackProps> = ({ tiles, onTileClick, selectedTileIds = [] }) => {
  return (
    <RackContainer>
      {tiles.map(tile => (
        <TileWrapper key={tile.id}>
          <Tile 
            tile={tile} 
            onClick={() => onTileClick && onTileClick(tile.id)}
            isSelected={selectedTileIds.includes(tile.id)}
          />
        </TileWrapper>
      ))}
    </RackContainer>
  );
};

export default PlayerRack;
