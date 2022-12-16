import React, { useState } from 'react'
import { Chess, ChessInstance } from 'chess.js'
import useChessStore from '../ts/state/chessStore'
import { pokeAction, resign, offerDraw, claimSpecialDraw } from '../ts/helpers/urbitChess'
import { CHESS } from '../ts/constants/chess'
import { Side, GameID, SAN, GameInfo, ActiveGameInfo } from '../ts/types/urbitChess'

export function GamePanel () {
  const { urbit, displayGame, displayMoves, setDisplayGame, offeredDraw, practiceBoard, setPracticeBoard, reviewMode, setReviewMode, reviewIndex, setReviewIndex } = useChessStore()
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

  const reviewPosition = (index: number) => {
    if (displayGame.info.moves[index].fen !== displayGame.info.moves[displayGame.info.moves.length - 1].fen) {
      console.log('PREVIOUS POSITION')
      const previousPosition: ActiveGameInfo = {
        position: displayGame.info.moves[index].fen,
        gotDrawOffer: displayGame.gotDrawOffer,
        sentDrawOffer: displayGame.sentDrawOffer,
        drawClaimAvailable: displayGame.drawClaimAvailable,
        autoClaimSpecialDraws: displayGame.autoClaimSpecialDraws,
        info: displayGame.info
      }

      setReviewMode(true)
      setReviewIndex(index)
      setDisplayGame(previousPosition)
    } else {
      console.log('CURRENT POSITION')
      const currentPosition: ActiveGameInfo = {
        position: displayGame.info.moves[displayGame.info.moves.length - 1].fen,
        gotDrawOffer: displayGame.gotDrawOffer,
        sentDrawOffer: displayGame.sentDrawOffer,
        drawClaimAvailable: displayGame.drawClaimAvailable,
        autoClaimSpecialDraws: displayGame.autoClaimSpecialDraws,
        info: displayGame.info
      }

      setReviewMode(false)
      setReviewIndex(null)
      setDisplayGame(currentPosition)
    }
  }

  const afterReviewIndex = (index: number) => {
    if (reviewMode === true) {
      if (index > reviewIndex) {
        return true
      } else {
        return false
      }
    }
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
            {
              Array.from(displayMoves).map((ply, thisIndex, thisArray) => {
                const nextIndex: number = thisIndex + 1
                // style={{ opacity: (showingIncoming ? 1.0 : 0.5) }}
                if (thisIndex % 2 === 0) {
                  return (
                    <li key={ thisIndex } className='move-item'>
                      <span onClick={() => reviewPosition(thisIndex)} style={{ opacity: (afterReviewIndex(thisIndex) ? 0.5 : 1.0) }}>{ply}</span> <span onClick={() => reviewPosition(nextIndex)} style={{ opacity: (afterReviewIndex(nextIndex) ? 0.5 : 1.0) }}>{(nextIndex > thisArray.length ? '' : thisArray.at(nextIndex))}</span>
                    </li>
                  )
                }
              })
            }
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
