import Urbit from '@urbit/http-api'
import { Ship, GameID, SAN, FENPosition, Move, GameInfo, ActiveGameInfo, Challenge, ChessUpdate, ChallengeUpdate } from '../types/urbitChess'

interface ChessState {
  urbit: Urbit | null
  displayGame: ActiveGameInfo | null
  displayMoves: Array<SAN> | null
  practiceBoard: String | null
  activeGames: Map<GameID, ActiveGameInfo>
  activeGameMoves: Map<GameID, Array<Move>>
  incomingChallenges: Map<Ship, Challenge>
  outgoingChallenges: Map<Ship, Challenge>
  friends: Array<Ship>
  displayIndex: number | null

  setUrbit: (urbit: Urbit) => void
  setDisplayGame: (displayGame: ActiveGameInfo | null) => void
  setDisplayMoves: (displayMoves: Array<SAN> | null) => void
  setPracticeBoard: (practiceBoard: String | null) => void
  setFriends: (friends: Array<Ship>) => void
  receiveChallengeUpdate: (data: ChallengeUpdate) => void
  receiveGame: (data: GameInfo) => void
  receiveUpdate: (data: ChessUpdate) => void
  declinedDraw: (gameID: GameID) => void
  offeredDraw: (gameID: GameID) => void
  setDisplayIndex: (displayIndex: number | null) => void
}

export default ChessState
