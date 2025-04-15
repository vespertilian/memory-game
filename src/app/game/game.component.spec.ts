import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameComponent } from './game.component';
import { MockComponent, MockProvider } from 'ng-mocks';
import { GameService } from '../game.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, of } from 'rxjs';
import { COMMON_STATUS } from '../status';
import { CardState, DisplayCard, GAME_STATUS, GameDetails } from '../game.models';
import { getElBySelector, getElsBySelector, getInstancesBySelector } from '../../test-helpers/component-selectors';
import { PlayerDetailsComponent } from '../player-details/player-details.component';
import { CardComponent } from '../card/card.component';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatLegacyProgressBar as MatProgressBar } from '@angular/material/legacy-progress-bar';

const player1Name = 'Cameron'
const player2Name = 'Nina'

const getGameFinishedDiv = <T>(fixture: ComponentFixture<T>) => getElBySelector(fixture, 'div.game-finished')
const getGameDetailDiv = <T>(fixture: ComponentFixture<T>) => getElBySelector(fixture, 'div.game-details')
const getButton = <T>(fixture: ComponentFixture<T>) => getElBySelector(fixture, 'button')
const getMatProgressBar = <T>(fixture: ComponentFixture<T>) => getElBySelector(fixture, 'mat-progress-bar')
const getLoadingError = <T>(fixture: ComponentFixture<T>) => getElBySelector(fixture, 'p.loading-error')
const getCards = <T>(fixture: ComponentFixture<T>) => getInstancesBySelector<CardComponent>(fixture, 'app-card');
const getPlayerDetails = <T>(fixture: ComponentFixture<T>) => getInstancesBySelector<PlayerDetailsComponent>(fixture, 'app-player-details');
const getMatGridTile = <T>(fixture: ComponentFixture<T>) => getElsBySelector(fixture, 'mat-grid-tile');
const numberOfCardsDisplayed = <T>(fixture: ComponentFixture<T>) => getCards(fixture).length

interface SetupParams {
  players: 1 | 2,
  status: COMMON_STATUS
  gameDetails?: GameDetails
  cards?: DisplayCard[]
}
describe('GameComponent', () => {
  function setup({players, status, gameDetails, cards}: SetupParams) {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(GameService, {
          status$: of(status),
          gameDetails$: of(gameDetails || {} as any),
          cards$: of(cards || {} as any),
          setup: jasmine.createSpy(),
          selectCard: jasmine.createSpy()
        }),
        MockProvider(ActivatedRoute, {
        get queryParamMap(): Observable<ParamMap> {
          const map = new Map([
            ['players', `${players}`],
            ['player1Name', player1Name],
            ['player2Name', player2Name]
          ]) as any
          return of(map)
        }
      })],
      declarations: [
        GameComponent,
        MockComponent(PlayerDetailsComponent),
        MockComponent(CardComponent),
        MockComponent(MatGridList),
        MockComponent(MatGridTile),
        MockComponent(MatProgressBar)
      ],
    })

    const fixture = TestBed.createComponent(GameComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return {
      fixture,
      component
    }
  }

  it('calls the game service setup function with query parameters from the route', () => {
    const {component} = setup({players: 1, status: COMMON_STATUS.resolved})
    expect(component.gameService.setup).toHaveBeenCalledWith({
      players: 1,
      player1Name,
      player2Name,
      numberOfCards: 15
    })
  });

  it('shows a loading spinner while the game service is pending', () => {
    const {fixture} = setup({players: 1, status: COMMON_STATUS.pending})
    expect(getMatProgressBar(fixture)).toBeTruthy()
  })

  it('shows a loading spinner while the game service is idle', () => {
    const {fixture} = setup({players: 1, status: COMMON_STATUS.idle})
    expect(getMatProgressBar(fixture)).toBeTruthy()
  })

  it('shows a error message if there was an error loading', () => {
    const {fixture} = setup({players: 1, status: COMMON_STATUS.rejected})
    const loadingError = getLoadingError(fixture)
    expect(loadingError).toBeTruthy()
    expect(loadingError?.innerText).toEqual('Error loading cards. Please refresh your browser.')
  })

  describe('cardById trackByFn', () => {
    it('returns the cards id', () => {
      const {component} = setup({players: 1, status: COMMON_STATUS.resolved})
      const result = component.cardById(0, createSelectedCard(1))
      expect(result).toEqual('1')
    })
  })

  describe('in-progress game - two player', () => {
    it('displays a grid of cards and game details', () => {
      const firstDisplayCard = createMatchedDisplayCard(1);
      const cards: DisplayCard[] = [
        firstDisplayCard,
        createMatchedDisplayCard(2),
        createMatchedDisplayCard(3),
        createMatchedDisplayCard(4),
        createUnmatchedUnselectedCard(4)
      ]

      const gameDetails: GameDetails = {
        gameStatus: GAME_STATUS.inProgress,
        player1Name,
        player2Name,
        player1Score: 0,
        player2Score: 0,
        twoPlayers: true,
        finishedMessage: '',
        currentPlayerName: player1Name
      }

      const { fixture, component } = setup({
        players: 2,
        status: COMMON_STATUS.resolved,
        gameDetails,
        cards
      })

      expect(getGameDetailDiv(fixture)).toBeTruthy()
      expect(getGameDetailDiv(fixture)?.innerHTML).toContain('VS')
      expect(numberOfCardsDisplayed(fixture)).toEqual(5)

      // check that we are binding the display cards correctly
      const firstCardComponent = getCards(fixture)[0]
      expect(firstCardComponent?.card).toEqual(firstDisplayCard)

      // check we are binding the player details correclty
      expect(getPlayerDetails(fixture)[0]?.gameDetails).toEqual(gameDetails)
      expect(getPlayerDetails(fixture)[1]?.gameDetails).toEqual(gameDetails)

      // clicking a tile selects the card
      expect(component.gameService.selectCard).not.toHaveBeenCalled()
      const firstGridTile = getMatGridTile(fixture)[0]
      firstGridTile.click()
      expect(component.gameService.selectCard).toHaveBeenCalledWith('1')
    })
  })

  describe('in-progress game - one player', () => {
    it('displays a grid of cards and game details', () => {
      const firstDisplayCard = createMatchedDisplayCard(1);
      const cards: DisplayCard[] = [
        firstDisplayCard,
        createMatchedDisplayCard(2),
        createMatchedDisplayCard(3),
        createMatchedDisplayCard(4),
        createUnmatchedUnselectedCard(4)
      ]

      const gameDetails: GameDetails = {
        gameStatus: GAME_STATUS.inProgress,
        player1Name,
        player2Name,
        player1Score: 0,
        player2Score: 0,
        twoPlayers: false,
        finishedMessage: '',
        currentPlayerName: player1Name
      }

      const { fixture, component } = setup({
        players: 2,
        status: COMMON_STATUS.resolved,
        gameDetails,
        cards
      })

      expect(getGameDetailDiv(fixture)).toBeTruthy()
      expect(getGameDetailDiv(fixture)?.innerHTML).not.toContain('VS')
      expect(numberOfCardsDisplayed(fixture)).toEqual(5)

      // check that we are binding the display cards correctly
      const firstCardComponent = getCards(fixture)[0]
      expect(firstCardComponent?.card).toEqual(firstDisplayCard)

      // check we are binding the player details correclty
      expect(getPlayerDetails(fixture)[0]?.gameDetails).toEqual(gameDetails)
      expect(getPlayerDetails(fixture)[1]?.gameDetails).toBeFalsy()

      // clicking a tile selects the card
      expect(component.gameService.selectCard).not.toHaveBeenCalled()
      const firstGridTile = getMatGridTile(fixture)[0]
      firstGridTile.click()
      expect(component.gameService.selectCard).toHaveBeenCalledWith('1')
    })
  })

  describe('game finished', () => {
    it('shows the game finished div, clicking the restart game button calls setup with the save parameters', () => {
      const cards: DisplayCard[] = [
        createMatchedDisplayCard(1),
        createMatchedDisplayCard(2),
        createMatchedDisplayCard(3),
        createMatchedDisplayCard(4),
        createUnmatchedUnselectedCard(4)
      ]

      const gameDetails: GameDetails = {
        gameStatus: GAME_STATUS.finished,
        player1Name,
        player2Name,
        player1Score: 2,
        player2Score: 0,
        twoPlayers: true,
        finishedMessage: 'Player 1 wins!',
        currentPlayerName: player1Name
      }

      const {fixture, component} = setup({
        players: 2,
        status: COMMON_STATUS.resolved,
        gameDetails,
        cards
      })

      const gameFinished = getGameFinishedDiv(fixture)
      expect(gameFinished?.innerHTML).toContain('Player 1 wins!')

      getButton(fixture)?.click()
      expect(component.gameService.setup).toHaveBeenCalledTimes(2)

      // if for some reason config is not set .. button will not work
      component.config = null;
      getButton(fixture)?.click()
      expect(component.gameService.setup).toHaveBeenCalledTimes(2)

      // cards are not shown when game is finished
      expect(numberOfCardsDisplayed(fixture)).toEqual(0)
      // player details still are
      expect(getGameDetailDiv(fixture)).toBeTruthy()
    })
  })
});

function createDisplayCard({ id, state, matchedBy}: {
  id: number,
  state: CardState,
  matchedBy: null | 1 | 2
}): DisplayCard {
  return {
    id: `${id}`,
    state,
    grayscaleImageUrl: 'gurl',
    primaryImageUrl: 'purl',
    matchedBy,
    picsumId: 'pid',
  }
}

function createMatchedDisplayCard(id: number): DisplayCard {
  return createDisplayCard({id, state: CardState.matched, matchedBy: 1})
}

function createUnmatchedUnselectedCard(id: number): DisplayCard {
  return createDisplayCard({id, state: CardState.unselectedAndUnmatched, matchedBy: null})
}

function createSelectedCard(id: number): DisplayCard {
  return createDisplayCard({id, state: CardState.selected, matchedBy: null})
}
