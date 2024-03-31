package utils

// Refers in https://github.com/galsondor/go-ascii.git
// This package provides fast ASCII equivalents to the test and conversion
// functions in the standard Go unicode package.

// Constants for ASCII characters without printable symbols.
const (
	NUL = 0x00 // '\0' Null
	SOH = 0x01 //      Start of Header
	STX = 0x02 //      Start of Text
	ETX = 0x03 //      End of Text
	EOT = 0x04 //      End of Transmission
	ENQ = 0x05 //      Enquiry
	ACK = 0x06 //      Acknowledgement
	BEL = 0x07 // '\a' Bell
	BS  = 0x08 // '\b' Backspace
	HT  = 0x09 // '\t' Horizontal Tab
	LF  = 0x0A // '\n' Line Feed
	VT  = 0x0B // '\v' Vertical Tab
	FF  = 0x0C // '\f' Form Feed
	CR  = 0x0D // '\r' Carriage Return
	SO  = 0x0E //      Shift Out
	SI  = 0x0F //      Shift In
	DLE = 0x10 //      Device Idle
	DC1 = 0x11 //      Device Control 1
	DC2 = 0x12 //      Device Control 2
	DC3 = 0x13 //      Device Control 3
	DC4 = 0x14 //      Device Control 4
	NAK = 0x15 //      Negative Acknowledgement
	SYN = 0x16 //      Synchronize
	ETB = 0x17 //      End of Transmission Block
	CAN = 0x18 //      Cancel
	EM  = 0x19 //      End of Medium
	SUB = 0x1A //      Substitute
	ESC = 0x1B // '\e' Escape
	FS  = 0x1C //      Field Separator
	GS  = 0x1D //      Group Separator
	RS  = 0x1E //      Record Separator
	US  = 0x1F //      Unit Separator
	SP  = 0x20 //      Space
	DEL = 0x7F //      Delete
)

//******************************************************************************
// Character class functions
//******************************************************************************

const (
	// Character class test case masks
	letterMask   uint16 = upp | low
	upperMask    uint16 = upp
	lowerMask    uint16 = low
	digitMask    uint16 = dig
	hexdigitMask uint16 = dig | hex
	alnumMask    uint16 = upp | low | dig
	spaceMask    uint16 = isp
	punctMask    uint16 = pun
	symbolMask   uint16 = sym
	controlMask  uint16 = ctl
	graphMask    uint16 = upp | low | dig | pun | sym
	printMask    uint16 = upp | low | dig | pun | sym | spc
)

// Return true if c is a letter; otherwise, return false.
func IsLetter(c byte) bool { return lookup[c]&letterMask != 0 }

// Return true if c is an upper case letter; otherwise, return false.
func IsUpper(c byte) bool { return lookup[c]&upperMask != 0 }

// Return true if c is a lower case letter; otherwise, return false.
func IsLower(c byte) bool { return lookup[c]&lowerMask != 0 }

// Return true if c is a decimal digit; otherwise, return false.
func IsDigit(c byte) bool { return lookup[c]&digitMask != 0 }

// Return true if c is a hexadecimal digit; otherwise, return false.
func IsHexDigit(c byte) bool { return lookup[c]&hexdigitMask != 0 }

// Return true if c is a letter or decimal digit; otherwise, return false.
func IsAlnum(c byte) bool { return lookup[c]&alnumMask != 0 }

// Return true if c is a punctuation character (!"#%&'()*,-./:;?@[\]_{}); otherwise, return false.
func IsPunct(c byte) bool { return lookup[c]&punctMask != 0 }

// Return true if c is a symbol ($+<=>^`|~); otherwise, return false.
func IsSymbol(c byte) bool { return lookup[c]&punctMask != 0 }

// Return true if c is a space character (space, tab, vertical tab,
// form feed, carriage return, or linefeed); otherwise, return false.
func IsSpace(c byte) bool { return lookup[c]&spaceMask != 0 }

// Return true if c is a control character; otherwise, return false.
func IsControl(c byte) bool { return lookup[c]&controlMask != 0 }

// Return true if c is a character with a graphic represntation;
// otherwise, return false.
func IsGraph(c byte) bool { return lookup[c]&graphMask != 0 }

// Return true if c is a character with a print represntation;
// otherwise, return false.
func IsPrint(c byte) bool { return lookup[c]&printMask != 0 }

// Return true if c is a valid ASCII character; otherwise, return false.
func IsASCII(c byte) bool { return c <= DEL }

//******************************************************************************
// Character conversion functions
//******************************************************************************

// Map an upper case letter to lower case; return other characters unchanged.
func ToLower(c byte) byte {
	if IsUpper(c) {
		return c + 0x20
	}
	return c
}

// Map a lower case letter to upper case; return other characters unchanged.
func ToUpper(c byte) byte {
	if IsLower(c) {
		return c - 0x20
	}
	return c
}

//******************************************************************************
// Character class lookup table
//******************************************************************************

// Character class bitmaps
const (
	// Exclusive classes -- one per character
	ctl uint16 = 0x01 // Control Character
	spc uint16 = 0x02 // The Space Character
	dig uint16 = 0x04 // Decimal Digit
	upp uint16 = 0x08 // Upper case Letter
	low uint16 = 0x10 // Lower case Letter
	pun uint16 = 0x20 // Punctuation
	sym uint16 = 0x40 // Punctuation
	// Addon classes
	hex uint16 = 0x100 // Hexidecmial Digit
	isp uint16 = 0x200 // Space-Like Character (IsSpace → true)
)

// Helpers for building lookup table
const (
	csp uint16 = ctl | isp // character that is both  control and space
	tsp uint16 = spc | isp // the true space character
	uhx uint16 = upp | hex // character that is both "UPALPHA" and "HEX"
	lhx uint16 = low | hex // character that is both "LOALPHA" and "HEX"
)

// Character class lookup table
var lookup = [256]uint16{
	/* 00-07  NUL, SOH, STX, ETX, EOT, ENQ, ACK, BEL */ ctl, ctl, ctl, ctl, ctl, ctl, ctl, ctl,
	/* 08-0F  BS,  HT,  LF,  VT,  FF,  CR,  SO,  SI  */ ctl, csp, csp, csp, csp, csp, ctl, ctl,
	/* 10-17  DLE, DC1, DC2, DC3, DC4, NAK, SYN, ETB */ ctl, ctl, ctl, ctl, ctl, ctl, ctl, ctl,
	/* 18-1F  CAN, EM,  SUB, ESC, FS,  GS,  RS,  US  */ ctl, ctl, ctl, ctl, ctl, ctl, ctl, ctl,
	/* 21-27  SP ! " # $ % & '   */ tsp, pun, pun, pun, sym, pun, pun, pun,
	/* 28-2F   ( ) * + , - . /   */ pun, pun, pun, sym, pun, pun, pun, pun,
	/* 30-37   0 1 2 3 4 5 6 7   */ dig, dig, dig, dig, dig, dig, dig, dig,
	/* 38-3F   8 9 : ; < = > ?   */ dig, dig, pun, pun, sym, sym, sym, pun,
	/* 40-47   @ A B C D E F G   */ pun, uhx, uhx, uhx, uhx, uhx, uhx, upp,
	/* 48-4F   H I J K L M N O   */ upp, upp, upp, upp, upp, upp, upp, upp,
	/* 50-57   P Q R S T U V W   */ upp, upp, upp, upp, upp, upp, upp, upp,
	/* 58-5F   X Y Z [ \ ] ^ _   */ upp, upp, upp, pun, pun, pun, sym, pun,
	/* 60-67   ` a b c d e f g   */ sym, lhx, lhx, lhx, lhx, lhx, lhx, low,
	/* 68-6F   h i j k l m n o   */ low, low, low, low, low, low, low, low,
	/* 70-77   p q r s t u v w   */ low, low, low, low, low, low, low, low,
	/* 78-7F   x y z { | } ~ DEL */ low, low, low, pun, sym, pun, sym, ctl,
	/* 80-87 */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* 88-8B */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* 90-97 */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* 98-9F */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* A0-A7 */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* A8-AF */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* B0-B7 */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* B8-BF */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* C0-C7 */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* C8-CF */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* D0-D7 */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* D8-DF */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* E0-E7 */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* E8-EF */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* F0-F7 */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* F8-FF */ 0, 0, 0, 0, 0, 0, 0, 0,
}

// eof
