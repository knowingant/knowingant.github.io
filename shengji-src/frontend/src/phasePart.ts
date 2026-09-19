/// Which slice of a phase component (Draw / Exchange / Play) to render.
///
/// `all` is the normal single-seat view. In 1v1 rooms one connection
/// controls two seats, so `Game` draws the shared `board` (players, trump,
/// trick) once, then one `seat` instance per seat (that seat's hand and
/// buttons) side by side, then the `footer` (points, previous trick, kitty)
/// once below them.
export type PhasePart = "all" | "board" | "seat" | "footer";

export const showsBoard = (part: PhasePart | undefined): boolean =>
  part === undefined || part === "all" || part === "board";

export const showsSeat = (part: PhasePart | undefined): boolean =>
  part === undefined || part === "all" || part === "seat";

export const showsFooter = (part: PhasePart | undefined): boolean =>
  part === undefined || part === "all" || part === "footer";
