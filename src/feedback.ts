import { APIGatewayEvent } from 'aws-lambda';
import { SES } from 'aws-sdk';

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event: APIGatewayEvent, context, callback): Promise<any> => {
	const feedbackEvent: FeedbackEvent = JSON.parse(event.body);

	if (isBefore(feedbackEvent.version, '6.2.15')) {
		return;
	}

	const body = `
		User: ${feedbackEvent.user}
		Version: ${feedbackEvent.version}		
		App logs: https://s3-us-west-2.amazonaws.com/com.zerotoheroes.support/${feedbackEvent.appLogsKey}`;
	const params: SES.Types.SendEmailRequest = {
		Destination: {
			ToAddresses: ['support@firestoneapp.com'],
		},
		Message: {
			Subject: {
				Charset: 'UTF-8',
				Data: feedbackEvent.type,
			},
			Body: {
				Text: {
					Charset: 'UTF-8',
					Data: body,
				},
			},
		},
		Source: 'support@firestoneapp.com',
	} as SES.Types.SendEmailRequest;
	const result = await new SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();
	const response = {
		statusCode: 200,
		isBase64Encoded: false,
		body: JSON.stringify({ message: 'ok', result: result }),
	};
	return response;
};

const isBefore = (appVersion: string, reference: string): boolean => {
	const appValue = buildAppValue(appVersion);
	const referenceValue = buildAppValue(reference);
	return appValue < referenceValue;
};

const buildAppValue = (appVersion: string): number => {
	const [major, minor, patch] = appVersion.split('.').map(info => parseInt(info));
	return 1000 * major + 100 * minor + patch;
};

interface FeedbackEvent {
	readonly user: string;
	readonly appLogsKey: string;
	readonly version: string;
	readonly type: string;
}
