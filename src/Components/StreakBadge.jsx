import React from 'react';
import { Tooltip } from '@mui/material';
import { Trophy } from 'lucide-react';

const EXPLANATION =
	'Consecutive wins. A loss resets your Victory Streak to 0, but a lucky first scan does not. Your Best Streak is kept.';

// Current and best win streak. The tooltip text is also the badge's accessible
// description (describeChild), so screen reader users hear the rules without
// having to find a hover target, and the badge is focusable so keyboard users
// can reveal the same text.
export default function StreakBadge({ streak, best }) {
	return (
		<Tooltip describeChild arrow title={EXPLANATION}>
			<span className='StreakBadge' tabIndex={0}>
				<span className='StreakItem'>
					<Trophy size={18} strokeWidth={2} aria-hidden='true' />
					{/* One text span: StreakItem is a flex row with a gap, which would
					    otherwise push every piece of the text apart. */}
					<span>
						<span className='long-label'>Victory </span>Streak: {streak}
					</span>
				</span>
				<span className='StreakItem'>
					<span>
						Best<span className='long-label'> Streak</span>: {best}
					</span>
				</span>
			</span>
		</Tooltip>
	);
}
