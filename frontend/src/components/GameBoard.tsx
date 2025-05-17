import React, { useState } from 'react';
import styled from 'styled-components';
import { TileSet as TileSetType } from '../utils/gameLogic';
import TileSet from './TileSet';

interface GameBoardProps {
  tileSets: TileSetType[];
  onTileClick?: (tileId: string) => void;
}

const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #2e7d32;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  width: 100%;
  max-width: 1200px;
  min-height: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const SetsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
`;

const EmptyBoardMessage = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  margin: 40px 0;
`;

const GameBoard: React.FC<GameBoardProps> = ({ tileSets, onTileClick }) => {
  return (
    <BoardContainer>
      <SetsContainer>
        {tileSets.length > 0 ? (
          tileSets.map(tileSet => (
            <TileSet 
              key={tileSet.id} 
              tileSet={tileSet} 
              onTileClick={onTileClick}
            />
          ))
        ) : (
          <EmptyBoardMessage>
            No sets on the board yet. Make your first move!
          </EmptyBoardMessage>
        )}
      </SetsContainer>
    </BoardContainer>
  );
};

export default GameBoard;
