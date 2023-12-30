import React from 'react';

const ShipGenerator = ({ count, maxValue }) => {
	const generateRandomNumbers = () => {
		const randomNumbers = new Set();
		while (randomNumbers.size < count) {
			const randomNumber = Math.floor(Math.random() * maxValue) + 1;
			randomNumbers.add(randomNumber);
		}
		return Array.from(randomNumbers);
	};

	const randomNumbers = generateRandomNumbers();

	return (
		<div>
			<h2>Generated Random Numbers:</h2>
			<ul>
				{randomNumbers.map((number, index) => (
					<li key={index}>{number}</li>
				))}
			</ul>
		</div>
	);
};

export default ShipGenerator;
