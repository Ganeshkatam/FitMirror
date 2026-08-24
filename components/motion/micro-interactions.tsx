import confetti from 'canvas-confetti'

export function triggerHeartBlast(x: number, y: number) {
    const scalar = 2
    const heart = confetti.shapeFromPath({
        path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z'
    })

    confetti({
        particleCount: 30,
        spread: 70,
        origin: { y: y / window.innerHeight, x: x / window.innerWidth },
        scalar,
        shapes: [heart],
        colors: ['#FF0000', '#FF69B4', '#FFD700'],
        ticks: 60,
        zIndex: 100,
        startVelocity: 30,
        gravity: 0.5,
        drift: 0,
    })
}

export function triggerSuccessBurst(x: number, y: number) {
    confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: y / window.innerHeight, x: x / window.innerWidth },
        colors: ['#4ade80', '#fbbf24', '#ffffff'], // Green, Gold, White
        startVelocity: 40,
        gravity: 0.8,
        ticks: 50,
        disableForReducedMotion: true,
        zIndex: 100,
    })
}
