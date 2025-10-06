import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class ErrorFilter implements GqlExceptionFilter {
  private readonly logger = new Logger('GraphQL Error Filter');

  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse() as any;
      message = response.message || exception.message;
      code = response.error || 'ERROR';
    } else if (exception instanceof GraphQLError) {
      message = exception.message;
      code = (exception.extensions?.code as string) || 'GRAPHQL_ERROR';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `${code} [${status}]: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    return new GraphQLError(message, {
      extensions: {
        code,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
