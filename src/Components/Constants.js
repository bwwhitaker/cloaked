export const CELL_SIZE = 50;
export const REVEAL_DELAY = 250;

// Text/link blue for the dark starfield. MUI's default primary blue (#1976d2)
// is only about 4:1 on it, short of the 4.5:1 small text needs; this is ~11:1.
export const LINK_BLUE = '#90caf9';

// Switch colours for the dark UI. MUI's default off-state track is dark on dark,
// which fails the 3:1 non-text contrast a control needs; the on state uses
// LINK_BLUE. Thumb and track both change between states.
export const SWITCH_SX = {
	'& .MuiSwitch-track': { backgroundColor: '#9aa4b2', opacity: 0.8 },
	'& .MuiSwitch-switchBase.Mui-checked': { color: LINK_BLUE },
	'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: LINK_BLUE, opacity: 0.9 },
};
