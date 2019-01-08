package randomstring

import (
	"crypto/rand"
	"math/big"
	pseudoRand "math/rand"
	"time"
)

const (
	dict = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)

func newRandomInt(max *big.Int) int {
	rand, err := rand.Int(rand.Reader, max)
	if err != nil {
		// Fallback to pseudo-random
		return pseudoRand.Intn(int(max.Int64()))
	}
	return int(rand.Int64())
}

// NewRandomString returns a alphanumeric random string with
// the specified length using crypto/rand with fallback to
// math/rand on error.
func NewRandomString(length int) string {
	buf := make([]byte, length)
	max := big.NewInt(int64(len(dict)))
	for i := 0; i < length; i++ {
		buf[i] = dict[newRandomInt(max)]
	}
	return string(buf)
}

func init() {
	// Make sure to seed default random generator.
	pseudoRand.Seed(time.Now().UTC().UnixNano())
}
