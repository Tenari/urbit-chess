import create from 'zustand'
import Urbit from '@urbit/http-api'
import { CHESS } from '../constants/chess'
import { Update, Ship, GameID, SAN, FENPosition, Move, GameInfo, ActiveGameInfo, Challenge, ChessUpdate, ChallengeUpdate, ChallengeSentUpdate, ChallengeReceivedUpdate, PositionUpdate, ResultUpdate, DrawOfferUpdate, DrawDeclinedUpdate, SpecialDrawPreferenceUpdate } from '../types/urbitChess'
import { findFriends } from '../helpers/urbitChess'
import ChessState from './chessState'

const useChessStore = create<ChessState>((set, get) => ({
  urbit: null,
  displayGame: null,
  displayMoves: [],
  practiceBoard: '',
  activeGames: new Map(),
  activeGameMoves: new Map(),
  incomingChallenges: new Map(),
  outgoingChallenges: new Map(),
  friends: [],
  displayIndex: null,
  setUrbit: (urbit: Urbit) => set({ urbit }),
  setDisplayGame: (displayGame: ActiveGameInfo | null) => {
    if (displayGame !== null) {
      // XX: "GameInfo or ActiveGameInfo?" conditional logic
      //
      //     might be necessary depending on how we implement
      //     the "view completed games" feature
      set({ displayMoves: [] })
      for (let move of displayGame.info.moves) {
        get().displayMoves.push(move.san)
      }
    } else {
      set({ displayMoves: [] })
      get().setDisplayIndex(null)
    }
    set({ displayGame })
  },
  setPracticeBoard: (practiceBoard: String | null) => set({ practiceBoard }),
  setFriends: async (friends: Array<Ship>) => set({ friends }),
  setDisplayIndex: (displayIndex: number | null) => {
    set({ displayIndex })
    console.log('setDisplayIndex displayIndex: ' + displayIndex)
  },
  receiveChallengeUpdate: (data: ChallengeUpdate) => {
    switch (data.chessUpdate) {
      case Update.ChallengeSent: {
        set(state => ({ outgoingChallenges: state.outgoingChallenges.set(data.who, data as ChallengeSentUpdate) }))
        break
      }
      case Update.ChallengeReceived: {
        set(state => ({ incomingChallenges: state.incomingChallenges.set(data.who, data as ChallengeReceivedUpdate) }))
        break
      }
      case Update.ChallengeResolved: {
        let outgoingChallenges: Map<Ship, Challenge> = get().outgoingChallenges
        outgoingChallenges.delete(data.who)

        set({ outgoingChallenges })
        break
      }
      case Update.ChallengeReplied: {
        let incomingChallenges: Map<Ship, Challenge> = get().incomingChallenges
        incomingChallenges.delete(data.who)

        set({ incomingChallenges })
        break
      }
      default: {
        console.log('RECEIVED BAD UPDATE')
        console.log(data.chessUpdate)
        console.log((data as ChallengeUpdate).chessUpdate)
        console.log((data as ChallengeUpdate).who)
      }
    }
  },
  receiveGame: async (data: GameInfo) => {
    const activeGame: ActiveGameInfo = {
      position: CHESS.defaultFEN,
      gotDrawOffer: false,
      sentDrawOffer: false,
      drawClaimAvailable: false,
      autoClaimSpecialDraws: false,
      info: data
    }

    set(state => ({ activeGames: state.activeGames.set(data.gameID, activeGame) }))

    await get().urbit.subscribe({
      app: 'chess',
      path: `/game/${data.gameID}/updates`,
      err: () => {},
      event: (data: ChessUpdate) => get().receiveUpdate(data),
      quit: () => {}
    })
  },
  receiveUpdate: (data: ChessUpdate) => {
    const updateDisplayGame = (updatedGame: ActiveGameInfo) => {
      if ((get().displayGame !== null) && (updatedGame.info.gameID === get().displayGame.info.gameID)) {
        get().setDisplayGame(updatedGame)
        get().setDisplayIndex(updatedGame.info.moves.length - 1)
        console.log('updateDisplayGame displayIndex: ' + (updatedGame.info.moves.length - 1))
      }
    }

    switch (data.chessUpdate) {
      case Update.Position: {
        const positionData = data as PositionUpdate
        const gameID = positionData.gameID
        const move = positionData.move
        const currentGame = get().activeGames.get(gameID)
        const activeGameMoves = get().activeGameMoves

        if (move.san !== null && move.fen !== null) {
          currentGame.info.moves.push(move)

          if (activeGameMoves.has(gameID) === false) {
            activeGameMoves.set(gameID, [move])
          } else {
            activeGameMoves.get(gameID).push(move)
            set({ activeGameMoves })
          }

          const updatedGame: ActiveGameInfo = {
            position: move.fen,
            gotDrawOffer: currentGame.gotDrawOffer,
            sentDrawOffer: currentGame.sentDrawOffer,
            drawClaimAvailable: positionData.specialDrawAvailable,
            autoClaimSpecialDraws: currentGame.autoClaimSpecialDraws,
            info: currentGame.info
          }

          set(state => ({ activeGames: state.activeGames.set(gameID, updatedGame) }))
          updateDisplayGame(updatedGame)

          if (get().displayMoves.length > 0) {
            get().setDisplayIndex(get().displayMoves.length - 1)
          }

          console.log('RECEIVED POSITION UPDATE')
          console.log('Update.Position displayIndex: ' + (get().displayIndex))
          console.log('Update.Position fen: ' + move.fen)
        }

        break
      }

      case Update.Result: {
        const resultData = data as ResultUpdate
        const gameID = resultData.gameID

        const displayGame = get().displayGame
        if ((displayGame !== null) && (gameID === displayGame.info.gameID)) {
          get().setDisplayGame(null)
        }

        var activeGames: Map<GameID, ActiveGameInfo> = get().activeGames
        activeGames.delete(gameID)

        set({ activeGames })

        console.log('RECEIVED RESULT UPDATE')
        break
      }

      case Update.DrawOffer: {
        const offerData = data as DrawOfferUpdate
        const gameID = offerData.gameID

        const currentGame = get().activeGames.get(gameID)
        const updatedGame: ActiveGameInfo = {
          position: currentGame.position,
          gotDrawOffer: true,
          sentDrawOffer: currentGame.sentDrawOffer,
          drawClaimAvailable: currentGame.drawClaimAvailable,
          autoClaimSpecialDraws: currentGame.autoClaimSpecialDraws,
          info: currentGame.info
        }

        set(state => ({ activeGames: state.activeGames.set(gameID, updatedGame) }))
        updateDisplayGame(updatedGame)

        console.log('RECEIVED DRAW OFFER UPDATE')
        break
      }

      case Update.DrawDeclined: {
        const declineData = data as DrawDeclinedUpdate
        const gameID = declineData.gameID

        const currentGame = get().activeGames.get(gameID)
        const updatedGame: ActiveGameInfo = {
          position: currentGame.position,
          gotDrawOffer: currentGame.gotDrawOffer,
          sentDrawOffer: false,
          drawClaimAvailable: currentGame.drawClaimAvailable,
          autoClaimSpecialDraws: currentGame.autoClaimSpecialDraws,
          info: currentGame.info
        }

        set(state => ({ activeGames: state.activeGames.set(gameID, updatedGame) }))
        updateDisplayGame(updatedGame)

        console.log('RECEIVED DRAW DECLINE UPDATE')
        break
      }
      case Update.SpecialDrawPreference: {
        const preferenceData = data as SpecialDrawPreferenceUpdate
        const gameID = preferenceData.gameID
        const setting = preferenceData.setting

        const currentGame = get().activeGames.get(gameID)
        const updatedGame: ActiveGameInfo = {
          position: currentGame.position,
          gotDrawOffer: currentGame.gotDrawOffer,
          sentDrawOffer: currentGame.sentDrawOffer,
          drawClaimAvailable: currentGame.drawClaimAvailable,
          autoClaimSpecialDraws: setting,
          info: currentGame.info
        }

        set(state => ({ activeGames: state.activeGames.set(gameID, updatedGame) }))
        updateDisplayGame(updatedGame)

        console.log('RECEIVED SPECIAL DRAW PREFERENCE UPDATE')
        break
      }
      default: {
        console.log('RECEIVED BAD UPDATE')
        console.log(data.chessUpdate)
        console.log((data as PositionUpdate).gameID)
        console.log((data as PositionUpdate).position)
      }
    }
  },
  declinedDraw: (gameID: GameID) => {
    let updatedGame: ActiveGameInfo = get().activeGames.get(gameID)
    updatedGame.gotDrawOffer = false

    set(state => ({ activeGames: state.activeGames.set(gameID, updatedGame) }))
  },
  offeredDraw: (gameID: GameID) => {
    let updatedGame: ActiveGameInfo = get().activeGames.get(gameID)
    updatedGame.sentDrawOffer = true

    set(state => ({ activeGames: state.activeGames.set(gameID, updatedGame) }))
  }
}))

export default useChessStore
