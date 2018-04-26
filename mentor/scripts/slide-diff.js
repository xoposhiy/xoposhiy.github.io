﻿function diffHtml(actual, expected, actualHeader, expectedHeader, hideEqualsLines) {
	actualHeader = actualHeader || 'Вывод вашей программы';
	expectedHeader = expectedHeader || 'Ожидаемый вывод';
	hideEqualsLines = hideEqualsLines === undefined ? false : hideEqualsLines;
	this.getEoln = function (s) {
		var good = ["\r\n", "\n", "\r"].filter(function(eoln) { return s.indexOf(eoln) >= 0 });
		return good.length > 0 ? good[0] : "\n";
	}

	this.split = function (s) {
		return s.split(this.getEoln(s));
	}

	this.toString = function(s) {
		return s === undefined ? "" : $('<div/>').text(s).html();
	}

	var actualList = this.split(actual);
	var expectedList = this.split(expected);

	var linesCount = Math.max(actualList.length, expectedList.length);

	var res = '<table class="diff"> <thead> <th></th> <th>' + actualHeader + '</th> <th>' + expectedHeader + '</th> </thead>';

	for (var i = 0; i < linesCount; ++i) {
		var equals = actualList[i] === expectedList[i];
		if (hideEqualsLines && equals) {
			var isPreviousDiff = (i > 0) && actualList[i - 1] !== expectedList[i - 1];
			var isNextDiff = (i < linesCount - 1) && actualList[i + 1] !== expectedList[i + 1];
			if (! isPreviousDiff && ! isNextDiff)
				continue;
		}
		var cssClass = equals ? "equals" : "different";
		res += '<tr class="' + cssClass + '"> <th> ' + (i + 1) + '</th>';
		res += '<td>' + this.toString(actualList[i]) + '</td>';
		res += '<td>' + this.toString(expectedList[i]) + '</td>';
		res += '</tr>';
	}
	res += '</table>';
	return res;
}