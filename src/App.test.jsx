import { render, screen } from '@testing-library/react';
import App from './App';

test('the game sits in a main landmark', () => {
	render(<App />);
	expect(screen.getByRole('main')).toHaveTextContent(/welcome to cloaked!/i);
});

test('renders opening message on load', () => {
	render(<App />);
	const linkElement = screen.getByText(/welcome to cloaked!/i);
	expect(linkElement).toBeInTheDocument();
});
