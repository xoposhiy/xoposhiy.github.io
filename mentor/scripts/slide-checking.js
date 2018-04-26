﻿$(document).ready(function () {
	var $exerciseScoreForm = $('.exercise__score-form');
	var $exerciseSimpleScoreForm = $('.exercise__simple-score-form');
	var isSimpleScoreForm = $exerciseSimpleScoreForm.length > 0;
	var $scoreBlock = $('.exercise__score');
	var $otherScoreLink = $scoreBlock.find('.exercise__other-score-link');
	// TODO: multiple $otherScoreInput on page with simple score forms
	var $otherScoreInput = $scoreBlock.find('[name=exerciseScore]');

	var setLockTimeout = function ($lock) {
		$lock[0].lockTimeout = setTimeout(function () {
			$lock.animate({ left: 15 });
			$lock.closest('.user-submission').find('.status').text('');
		}, 8000);
	};

	var clearLockTimeout = function ($lock) {
		var lockTimeout = $lock[0].lockTimeout;
		if (lockTimeout)
			clearTimeout(lockTimeout);
	};

	var sendSimpleScore = function ($scoreForm, ignoreNewestSubmission) {
		ignoreNewestSubmission = ignoreNewestSubmission || false;
		var $status = $scoreForm.find('.status');
		var $userSubmissionInfo = $scoreForm.closest('.user-submission').find('.user-submission__info');
		$status.removeClass('success').removeClass('error').text('Сохраняем..').addClass('waiting');

		var postData = $scoreForm.serialize();
		if (ignoreNewestSubmission)
			postData += "&ignoreNewestSubmission=true";
		if ($scoreForm.data('checkingId'))
			postData += "&updateCheckingId=" + parseInt($scoreForm.data('checkingId'));

		clearLockTimeout($userSubmissionInfo);

		$.ajax({
			type: 'post',
			url: $scoreForm.attr('action'),
			data: postData
		}).done(function (data) {
			if (data.status && data.status !== 'ok') {
				$status.addClass('error');
				var error = '';
				if (data.error === 'has_newest_submission') {
					error = 'Пользователь успел отправить ещё одно решение по&nbsp;этой задаче {NEW_SUBMISSION_DATE}. Поставить баллы ' +
						'<a href="#" data-submission-id="{SUBMISSION}" class="simple-score-link internal-page-link">старому решению</a>, ' +
						'<a href="#" data-submission-id="{NEW_SUBMISSION}" class="simple-score-link internal-page-link">новому</a> ' +
						'или <a href="#" class="cancel-link internal-page-link">отменить</a>?';
					error = error.replace('{SUBMISSION}', $scoreForm.find('[name=submissionId]').val())
						.replace('{NEW_SUBMISSION}', data.submissionId)
						.replace('{NEW_SUBMISSION_DATE}', data.submissionDate);
				} else if (data.error === 'has_greatest_score') {
					error =
						'Пользователь имеет за&nbsp;код-ревью по&nbsp;этой задаче больше баллов: {SCORE}. Новыми баллами вы&nbsp;<strong>не&nbsp;понизите</strong> его суммарную оценку. <a href="{URL}" target="_blank">Предыдущие код-ревью</a>.';
					error = error.replace('{SCORE}', data.score).replace('{URL}', data.checkedQueueUrl);
				}
				$status.html(error);
			} else {
				$status.addClass('success').text('Сохранено: ' + data.score);
				$scoreForm.data('checkingId', data.checkingId);
				$userSubmissionInfo.find('.total-score').text(data.totalScore);
				/* Lock after one second */
				setTimeout(function () {
					$status.text('');
					$userSubmissionInfo.animate({ left: 15 });
				}, 1000);
			}
		}).always(function() {
			$status.removeClass('waiting');
		});
	};

	$scoreBlock.on('click', '.simple-score-link', function(e) {
		e.preventDefault();
		var $self = $(this);
		var submissionId = $self.data('submissionId');
		var $form = $self.closest('.exercise__simple-score-form');
		clearLockTimeout($self.closest('.user-submission').find('.user-submission__info'));
		$form.find('[name=submissionId]').val(submissionId);
		sendSimpleScore($form, true);
	});

	$scoreBlock.on('click', '.cancel-link', function (e) {
		e.preventDefault();
		$(this).closest('.status').text('');
	});

	$scoreBlock.on('click', '.exercise__other-score-link', function (e) {
		e.preventDefault();
		$scoreBlock.find('.btn-group .btn').removeClass('active');
		$otherScoreInput.show();
		$otherScoreInput.focus();
		$otherScoreLink.addClass('active');

        /* Restore prohibitFurtherReview checkbox state */
        var $checkbox = $exerciseScoreForm.closest('.exercise').find('[name="prohibitFurtherReview"]');
        $checkbox.prop('checked', $checkbox.data('initial-state'));
	});

	$scoreBlock.find('.btn-group').on('click', '.btn', function () {
		var $self = $(this);
		var wasActive = $self.hasClass('active');
		var $btnGroup = $self.closest('.btn-group');

		$btnGroup.find('.btn').removeClass('active');
		if (isSimpleScoreForm) {
			$otherScoreInput.val($self.data('value'));
			$self.addClass('active');

			var $scoreForm = $self.closest('.exercise__simple-score-form');
			sendSimpleScore($scoreForm);
		} else {
			$self.toggleClass('active', !wasActive);

			$otherScoreInput.hide();
			$otherScoreLink.removeClass('active');
			$otherScoreInput.val(wasActive ? "" : $self.data('value'));
			
			/* Clicking on button "100%" makes prohibitFurtherReview checkbox checked. */
            var $checkbox = $exerciseScoreForm.closest('.exercise').find('[name="prohibitFurtherReview"]');
			if ($self.data('percent') === 100) {
				/* Remember checkbox state before changing */
				$checkbox.data('initial-state', $checkbox.prop('checked'));
				$checkbox.prop('checked', true);
			} else {
				/* Restore checkbox state */
				$checkbox.prop('checked', $checkbox.data('initial-state'));				
			}
		}
	});

	$exerciseScoreForm.find('input[type=submit]').click(function() {
		if ($otherScoreInput.is(':invalid')) {
			$otherScoreInput.show();
			$otherScoreLink.addClass('active');
		}
	});

	function updateTopReviewComments($exerciseAddReviewBlock) {
		var $topReviewComments = $('.exercise__top-review-comments.hidden');
		if ($topReviewComments.find('.comment').length === 0) {
			$exerciseAddReviewBlock.addClass('without-comments');
			return;
		}
		var $topComments = $topReviewComments.clone(true).removeClass('hidden');

		$('.exercise__add-review__top-comments').find('.exercise__top-review-comments').remove();
		$('.exercise__add-review__top-comments').append($topComments);
	}

	$('.exercise__add-review').each(function () {
		updateTopReviewComments($(this));
	});

	$('.exercise__top-review-comments').on('click', '.comment .copy-comment-link', function(e) {
		e.preventDefault();
		$('.exercise__add-review__comment')
			.val($(this).data('value'))
			.trigger('input');
	});

	$('.exercise__top-review-comments').on('click', '.comment .remove-link', function (e) {
		e.preventDefault();

		var $self = $(this);
		var url = $self.data('url');
		var comment = $self.data('value');
		var $exerciseAddReviewBlock = $self.closest('.exercise__add-review');

		$.post(url, {comment: comment}).done(function(data) {
			var $data = $(data);
			$('.exercise__top-review-comments.hidden').html($data.html());
			updateTopReviewComments($exerciseAddReviewBlock);
		}).fail(function() {
			alert('Произошла ошибка при удалении комментария. Попробуйте повторить позже');
		});

		return false;
	});
	
	$('.user-submission__info').bind('move', function (e) {
		var $self = $(this);
		var left = parseInt($self.css('left'));
		$self.css({ left: left + e.deltaX });
	}).bind('moveend', function(e) {
		var $self = $(this);
		if (e.distX < 50)
			$self.animate({ left: 15 });
		else {
			/* Unlock */
			$self.animate({ left: $(window).width() + 15 });
			/* And lock after 8 seconds */
			setLockTimeout($self);
		}
	});

	$('.exercise__simple-score-form').bind('move', function(e) {
		var $submissionInfo = $(this).closest('.user-submission').find('.user-submission__info');
		var left = parseInt($submissionInfo.css('left'));
		$submissionInfo.css({ left: left + e.deltaX });
	}).bind('moveend', function (e) {
		var $submissionInfo = $(this).closest('.user-submission').find('.user-submission__info');
		clearLockTimeout($submissionInfo);
		/* Unlock or lock */
		if (Math.abs(e.distX) < 50) {
			$submissionInfo.animate({ left: $(window).width() + 15 });
			setLockTimeout($submissionInfo); 
		} else {
			$submissionInfo.animate({ left: 15 });
			$submissionInfo.closest('.user-submission').find('.status').text('');
		}
	});
});