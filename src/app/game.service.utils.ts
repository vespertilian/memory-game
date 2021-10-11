import { PICSUM_URL, PicsumPhoto, PicsumPhotos } from './lorem-picsum.service';
import { Card, CardData, CardState, GameState, GameStatus, MatchSet } from './game.models';

export function createCardsFromPicsumPhotos({ width, height, }: { width: number, height: number}) {
  return function createCardFromList(list: PicsumPhotos): CardData {
    return list.reduce(createCard, {cards: new Map(), cardOrder: []}) as CardData
  }

  function createCard(acc: CardData, listItem: PicsumPhoto): CardData {
    const id1 = `${listItem.id}--1`;
    const id2 = `${listItem.id}--2`;
    const picsumId = listItem.id;
    acc.cards.set(id1, {
      id: id1,
      picsumId,
      primaryImageUrl: createUrl({id: picsumId, width, height}),
      grayscaleImageUrl: createGrayscaleUrl({id: picsumId, width, height}),
    });
    acc.cards.set(id2, {
      id: id2,
      picsumId: listItem.id,
      primaryImageUrl: createUrl({id: picsumId, width, height}),
      grayscaleImageUrl: createGrayscaleUrl({id: picsumId, width, height}),
    });
    acc.cardOrder.push(id1);
    acc.cardOrder.push(id2);

    return acc;
  }
}

export function shuffleCardOrderMakeUneven(cardData: CardData) {
  // shuffle array then remove one value to make uneven
  return {
    ...cardData,
    cardOrder:
      shuffleArray(cardData.cardOrder).slice(0, -1),
  }
}
// stack overflow special! https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffleArray<T>(_array: T[]): T[] {
  const array = [..._array]; // lets not update the array in place ....
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// display card

export function gameStateToDisplayCards(gameState: GameState) {
  return gameState.cardOrder.map((id) => cardIdToDisplayCard({
    cardId: id,
    gameState
  }))
}

export function cardIdToDisplayCard({cardId, gameState}: {cardId: string, gameState: GameState}) {
  const card = gameState!.cards.get(cardId) as Card


  const {player1Matches, player2Matches} = gameState
  const selected =  gameState.selectedIds.has(cardId)
  const matchedBy = getMatchedBy({player1Matches, player2Matches, cardId})
  return {
    ...card,
    state: getCardState({selected, matchedBy}),
    matchedBy
  }
}

export function getMatchedBy({ player1Matches, player2Matches, cardId }: { player1Matches: MatchSet, player2Matches: MatchSet, cardId: string }): 1 | 2 | null {
  if (player1Matches.has(cardId)) {
    return 1
  }
  if (player2Matches.has(cardId)) {
    return 2
  }
  return null
}

export function getCardState({selected, matchedBy}: {selected: boolean, matchedBy: 1 | 2 | null}) {
  if (selected) {
    return CardState.selected
  }
  if (matchedBy !== null) {
    return CardState.matched
  }
  return CardState.unselectedAndUnmatched
}

// game details

export function gameStateToDetails(state: GameState) {
  const player1Matches = state.player1Matches.size
  const player2Matches = state.player2Matches.size
  const totalMatches = player1Matches + player2Matches;

  // we make the set odd by removing a card so we're finished
  // when the card size is two smaller than the total
  const finished = (state.cards.size - 2) === totalMatches

  return {
    players: state.players,
    player1Name: state.player1Name,
    player2Name: state.player2Name || '',
    player1Score: state.player1Matches.size / 2,
    player2Score: state.player2Matches.size / 2,
    gameStatus: finished ? GameStatus.finished : GameStatus.inProgress
  }
}

// players
export function swapPlayer({currentPlayer, players}: { currentPlayer: 1 | 2, players: 1 | 2 }): 1 | 2 {
  if (players === 1) {
    return 1
  }
  if (currentPlayer === 2) {
    return 1
  }
  return 2
}

export function isGameState(value: null | GameState): value is GameState {
  if (value !== null) {
    return true
  }
  return false
}

// image urls
interface CreateImageUrlParams {
  id: string
  width: number
  height: number
}

function createUrl({id, width, height}: CreateImageUrlParams) {
  return `${PICSUM_URL}/id/${id}/${width}/${height}`
}

function createGrayscaleUrl(params: CreateImageUrlParams) {
  return `${createUrl(params)}?grayscale&blur=2`
}

