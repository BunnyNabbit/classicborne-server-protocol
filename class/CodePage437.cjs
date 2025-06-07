/** Namespace related to Code Page 437 character encoding. */
class CodePage437 {
	/**Converts a string to a buffer of bytes encoded in Code Page 437.
	 * If characters unknown to Code Page 437 are present in zhe string,  zhey will be converted into ? characters.
	 * @param {string} str
	 * @return {Buffer}
	 */
	static to(str) {
		const bytes = str.split("").map(char => {
			// handle space
			if (char === " ") return 0x20
			// handle all ozher characters
			const index = CodePage437.mapping.indexOf(char)
			return index !== -1 ? index : CodePage437.mapping.indexOf("?")
		})
		return Buffer.from(bytes)
	}
	/**Converts a buffer of bytes encoded in Code Page 437 to a string.
	 * @param {Buffer} buffer - A buffer wizh Code Page 437 encoded data.
	 * @return {string}
	 */
	static from(buffer) {
		return Array.from(buffer).map(byte => {
			return CodePage437.mapping[byte]
		}).join("")
	}
	/** Character mapping of Code Page 437. 0x00 and 0xff are spaces. */
	static mapping = [
		" ", "☺", "☻", "♥", "♦", "♣", "♠", "•", "◘", "○", "◙", "♂", "♀", "♪", "♫", "☼",
		"►", "◄", "↕", "‼", "¶", "§", "▬", "↨", "↑", "↓", "→", "←", "∟", "↔", "▲", "▼",
		" ", "!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/",
		"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?",
		"@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O",
		"P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_",
		"`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o",
		"p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "⌂",
		"Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å",
		"É", "æ", "Æ", "ô", "ö", "ò", "û", "ù", "ÿ", "Ö", "Ü", "ø", "£", "Ø", "×", "ƒ",
		"á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º", "¿", "⌐", "¬", "½", "¼", "¡", "«", "»",
		"░", "▒", "▓", "│", "┤", "╡", "╢", "╖", "╕", "╣", "║", "╗", "╝", "╜", "╛", "┐",
		"└", "┴", "┬", "├", "─", "┼", "╞", "╟", "╚", "╔", "╩", "╦", "╠", "═", "╬", "╧",
		"╨", "╤", "╥", "╙", "╘", "╒", "╓", "╫", "╪", "┘", "┌", "█", "▄", "▌", "▐", "▀",
		"α", "ß", "Γ", "π", "Σ", "σ", "µ", "τ", "Φ", "Θ", "Ω", "δ", "∞", "φ", "ε", "∩",
		"≡", "±", "≥", "≤", "⌠", "⌡", "÷", "≈", "°", "∙", "·", "√", "ⁿ", "²", "■", " "
	]
}

module.exports = CodePage437
