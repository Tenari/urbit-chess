import create from 'zustand'
import Urbit from '@urbit/http-api'
import { CHESS } from '../constants/chess'
import { Update, Ship, GameID, SAN, GameInfo, ActiveGameInfo, Challenge, ChessUpdate, ChallengeUpdate, ChallengeSentUpdate, ChallengeReceivedUpdate, PositionUpdate, ResultUpdate, DrawOfferUpdate, DrawDeclinedUpdate, SpecialDrawPreferenceUpdate } from '../types/urbitChess'
import { findFriends } from '../helpers/urbitChess'
import ChessState from './chessState'

const useChessStore = create<ChessState>((set, get) => ({
  urbit: null,
  displayGame: null,
  displayMoves: [],
  practiceBoard: '',
  activeGames: new Map(),
  incomingChallenges: new Map(),
  outgoingChallenges: new Map(),
  friends: [],
  setUrbit: (urbit: Urbit) => set({ urbit }),
  setDisplayGame: (displayGame: ActiveGameInfo | null) => {
    if (displayGame !== null) {
      set({ displayGame })
      // XX: "GameInfo or ActiveGameInfo?" conditional logic
      //
      //     might be necessary depending on how we implement
      //     the "view completed games" feature
      get().setDisplayMoves(displayGame.info.moves)
    } else {
      // XX: get moves list working for practice games
      //
      //     will require work in Chessboard.tsx, perhaps
      //     work on the backend e.g. a new poke to just
      //     get the PositionUpdate through /updates wire
      set({ displayGame })
      get().setDisplayMoves([])
    }
  },
  setDisplayMoves: (displayMoves: Array<SAN>) =>
    set(state => ({ displayMoves })),
  setPracticeBoard: (practiceBoard: String | null) => set({ practiceBoard }),
  setFriends: async (friends: Array<Ship>) => set({ friends }),
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
      const displayGame = get().displayGame

      if ((displayGame !== null) && (updatedGame.info.gameID === displayGame.info.gameID)) {
        get().setDisplayGame(updatedGame)
      }
    }

    switch (data.chessUpdate) {
      case Update.Position: {
        const positionData = data as PositionUpdate
        const gameID = positionData.gameID
        const specialDrawAvailable = positionData.specialDrawAvailable
        const currentGame = get().activeGames.get(gameID)
        if (positionData.move !== '') {
          currentGame.info.moves.push(positionData.move)
        }
        const updatedGame: ActiveGameInfo = {
          position: positionData.position,
          gotDrawOffer: currentGame.gotDrawOffer,
          sentDrawOffer: currentGame.sentDrawOffer,
          drawClaimAvailable: specialDrawAvailable,
          autoClaimSpecialDraws: currentGame.autoClaimSpecialDraws,
          info: currentGame.info
        }

        set(state => ({ activeGames: state.activeGames.set(gameID, updatedGame) }))
        updateDisplayGame(updatedGame)

        // DD
        // console.log('RECEIVED POSITION UPDATE: ' + updatedGame.info.moves)
        console.log('RECEIVED POSITION UPDATE')
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
