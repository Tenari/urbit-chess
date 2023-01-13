import React, { useState } from 'react'
import { Chess, ChessInstance } from 'chess.js'
import useChessStore from '../ts/state/chessStore'
import { pokeAction, resign, offerDraw, claimSpecialDraw } from '../ts/helpers/urbitChess'
import { CHESS } from '../ts/constants/chess'
import { Side, GameID, SAN, GameInfo, ActiveGameInfo } from '../ts/types/urbitChess'

export function PracticePanel () {
  const { displayGame, setPracticeBoard } = useChessStore()
  const hasGame: boolean = (displayGame !== null)
  const practiceHasMoved = (localStorage.getItem('practiceBoard') !== CHESS.defaultFEN)
  return (
    <div className='game-panel-container col' style={{ display: ((displayGame == null) ? 'flex' : ' none') }}>
      <div className="game-panel col">
        <button
          className='option'
          disabled={hasGame || !practiceHasMoved}
          onClick={() => setPracticeBoard(null)}>
          Reset Practice Board
        </button>
      </div>
    </div>
  )
}
