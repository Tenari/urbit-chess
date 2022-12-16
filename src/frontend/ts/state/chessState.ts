import Urbit from '@urbit/http-api'
import { Ship, GameID, SAN, FENPosition, GameInfo, ActiveGameInfo, Challenge, ChessUpdate, ChallengeUpdate } from '../types/urbitChess'

interface ChessState {
  urbit: Urbit | null
  displayGame: ActiveGameInfo | null
  displayMoves: Array<SAN> | null
  practiceBoard: String | null
  activeGames: Map<GameID, ActiveGameInfo>
  incomingChallenges: Map<Ship, Challenge>
  outgoingChallenges: Map<Ship, Challenge>
  friends: Array<Ship>
  reviewMode: boolean
  reviewIndex: number | null

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
  setReviewMode: (reviewMode: boolean) => void
  setReviewIndex: (reviewIndex: number | null) => void
}

export default ChessState
