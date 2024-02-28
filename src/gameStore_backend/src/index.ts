import {
    Canister,
    Err,
    int64,
    nat64,
    Ok,
    Opt,
    Principal,
    query,
    Record,
    Result,
    StableBTreeMap,
    text,
    update,
    Variant,
    Vec,
} from "azle";

const GAMES_STORAGE_MEMORY_ID = 0;

const Game = Record({
    id: Principal,
    title: text,
    description: text,
    price: int64,
    stock: int64,
    createdDate: text
});
type Game = typeof Game.tsType;

const GameCreatePayload = Record({
    title: text,
    description: text,
    price: int64,
    stock: int64
});
type GameCreatePayload = typeof GameCreatePayload.tsType;

const GameIDPayload = Record({
    id: Principal,
});
type GameIDPayload = typeof GameIDPayload.tsType;

const Error = Variant({
    GameNotFound: Principal
})
type Error = typeof Error.tsType;

let gamesStorage = StableBTreeMap<Principal, Game>(GAMES_STORAGE_MEMORY_ID);

function generateID() {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
    }

    return Principal.fromUint8Array(Uint8Array.from(array));
}

export default Canister({
    insertGame: update(
        [GameCreatePayload],
        Game,
        (dto: GameCreatePayload) => {
          const game: Game = {
            id: generateID(),
            title: dto.title,
            description: dto.description,
            price: dto.price,
            stock: dto.stock,
            createdDate: new Date().toDateString(),
          };
          gamesStorage.insert(game.id, game);
    
          return game;
        }
      ),

      getGameCount: query([], nat64, () => {
        return gamesStorage.len();
      }),
    
      getGameById: query([Principal], Opt(Game), (id: Principal) => {
        return gamesStorage.get(id);
      }),
    
      getGames: query([], Vec(Game), () => {
        return gamesStorage.values();
      }),

      deleteGame: update(
        [GameIDPayload],
        Result(text, Error),
        (dto: GameIDPayload) => {
            const gameToDelete = gamesStorage.get(dto.id);
            if ("None" in gameToDelete) {
                return Err({
                    GameNotFound: dto.id
                });
            }

            gamesStorage.remove(dto.id);
            return Ok("Game with id " + dto.id + " deleted!");
        }
      ),

      updateGame: update(
        [Game],
        Result(text, Error),
        (dto: Game) => {
            const gameToUpdate = gamesStorage.get(dto.id);
            if ("None" in gameToUpdate) {
                return Err({
                    GameNotFound: dto.id
                });
            }

            const game: Game = {
                id: dto.id,
                title: dto.title,
                description: dto.description,
                price: dto.price,
                stock: dto.stock,
                createdDate: gameToUpdate.Some.createdDate,
              };

            gamesStorage.remove(dto.id);
            gamesStorage.insert(dto.id, game);
            return Ok("Game with id " + dto.id + " updated!");
        }
      ),
});
