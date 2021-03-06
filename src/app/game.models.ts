export interface GameParams {
  players: 1 | 2;
  player1Name: string;
  player2Name?: string;
  numberOfCards: number;
}

export interface Card {
  id: string;
  picsumId: string;
  primaryImageUrl: string;
  grayscaleImageUrl: string;
}

export enum CardState {
  matched = 'matched',
  selected = 'selected',
  unselectedAndUnmatched = 'unselectedAndUnmatched'
}

export interface DisplayCard extends Card {
  state: CardState
  matchedBy: null | 1 | 2;
}

export interface CardData {
  cards: Map<string, Card>;
  cardOrder: string[];
}

export type MatchSet = Set<string>;

export interface GameState extends GameParams, CardData {
  disabled: boolean;
  currentPlayer: 1 | 2;
  selectedIds: Map<string, string>;
  player1Matches: MatchSet;
  player2Matches: MatchSet;
}

export enum GAME_STATUS {
  inProgress = 'inProgress',
  finished = 'finished'
}

export interface GameDetails {
  twoPlayers: boolean,
  currentPlayerName: string
  player1Name: string,
  player2Name: string
  player1Score: number
  player2Score: number
  gameStatus: GAME_STATUS
  finishedMessage: string
}
