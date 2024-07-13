import { render, screen } from '@testing-library/react';
import App from './App';

test('renders opening message on load', () => {
	render(<App />);
	const linkElement = screen.getByText(/welcome to cloaked!/i);
	expect(linkElement).toBeInTheDocument();
});
