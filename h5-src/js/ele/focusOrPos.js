FOCUS_OR_POS = {
	CreateNew: function(isFocusBody, pos) {
        var newObj = {"isFocusBody":isFocusBody, "pos":ClonePosition(pos)};
		newObj.__proto__ = FOCUS_OR_POS;
        return newObj;
	}
};