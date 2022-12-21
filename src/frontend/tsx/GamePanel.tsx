import React, { useState } from 'react'
import { Chess, ChessInstance } from 'chess.js'
import useChessStore from '../ts/state/chessStore'
import { pokeAction, resign, offerDraw, claimSpecialDraw } from '../ts/helpers/urbitChess'
import { CHESS } from '../ts/constants/chess'
import { Side, GameID, SAN, GameInfo, ActiveGameInfo } from '../ts/types/urbitChess'

export function GamePanel () {
  const { urbit, displayGame, displayMoves, setDisplayGame, offeredDraw, practiceBoard, setPracticeBoard, displayIndex, setDisplayIndex } = useChessStore()
  const hasGame: boolean = (displayGame !== null)
  const practiceHasMoved = (localStorage.getItem('practiceBoard') !== CHESS.defaultFEN)
  const opponent = !hasGame ? '~sampel-palnet' : (urbit.ship === displayGame.info.white.substring(1))
    ? displayGame.info.black
    : displayGame.info.white

  const resignOnClick = async () => {
    const gameID = displayGame.info.gameID
    await pokeAction(urbit, resign(gameID))
  }

  const offerDrawOnClick = async () => {
    const gameID = displayGame.info.gameID
    await pokeAction(urbit, offerDraw(gameID), null, () => { offeredDraw(gameID) })
  }

  const claimSpecialDrawOnClick = async () => {
    const gameID = displayGame.info.gameID
    await pokeAction(urbit, claimSpecialDraw(gameID))
  }

  const moveOpacity = (index: number) => {
      if (index > displayIndex) {
        return 0.4
      } else {
        return 1.0
      }
  }

  const moveList = () => {
    let components = [];
    for (let i: number = 0; i < displayMoves.length; i += 2) {
      const move: number = (i / 2) + 1
      const wIndex: number = i
      const bIndex: number = i + 1
      const wMove: SAN = displayMoves[i]
      const bMove: SAN = displayMoves[i + 1]

      if (bIndex > displayMoves.length) {
        components.push(
          <li key={ move } className='move-item' style={{ opacity: moveOpacity(wIndex) }}>
            <span onClick={ () => setDisplayIndex(wIndex) }>
              { wMove }
            </span>
          </li>
        )
      } else {
        components.push(
          <li key={ move } className='move-item' style={{ opacity: moveOpacity(wIndex) }}>
            <span onClick={ () => setDisplayIndex(wIndex) }>
              { wMove }
            </span>
            { '\xa0'.repeat(6 - wMove.length) }
            <span onClick={ () => setDisplayIndex(bIndex) } style={{ opacity: (wIndex <= displayIndex && bIndex > displayIndex) ? 0.4 : 1.0}}>
              { bMove }
            </span>
          </li>
        )
      }
    }
    
    return components
  }

  return (
    <div className='game-panel-container col'>
      <div className="game-panel col">
        <div id="opp-timer" className={'timer row' + (hasGame ? '' : ' hidden')}>
          <p>00:00</p>
        </div>
        <div id="opp-player" className={'player row' + (hasGame ? '' : ' hidden')}>
          <p>{opponent}</p>
        </div>
        <div className={'moves col' + (hasGame ? '' : ' hidden')}>
          <ol>
            { moveList() }
          </ol>
        </div>
        <div id="our-player" className={'player row' + (hasGame ? '' : ' hidden')}>
          <p>~{window.ship}</p>
        </div>
        <div id="our-timer" className={'timer row' + (hasGame ? '' : ' hidden')}>
          <p>00:00</p>
        </div>
        {/* buttons */}
        {/* offer draw button */}
        <button
          className='option'
          disabled={!hasGame || displayGame.sentDrawOffer}
          onClick={offerDrawOnClick}>
          Offer Draw</button>
        {/* resign button */}
        <button
          className='option'
          disabled={!hasGame}
          onClick={resignOnClick}>
          Resign</button>
        {/* claim special draw */}
        {hasGame ? (
          <button
            className='option'
            disabled={!displayGame.drawClaimAvailable}
            onClick={claimSpecialDrawOnClick}>
            Claim Special Draw</button>
        ) : (null)
        }
        {/* (reset) practice board */}
        {hasGame ? (
          <button
            className='option'
            disabled={!hasGame}
            onClick={() => setDisplayGame(null)}>
            Practice Board</button>
        ) : (
          <button
            className='option'
            disabled={hasGame || !practiceHasMoved}
            onClick={() => setPracticeBoard(null)}>
            Reset Practice Board</button>
        )}
      </div>
    </div>
  )
}
