import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log error details (but not in production to avoid exposing sensitive info)
    const errorContext = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    if (process.env.NODE_ENV === 'production') {
      // In production, log minimal error info
      this.logger.error(`${errorContext.method} ${errorContext.path} - ${status} - ${message}`);
    } else {
      // In development, log full error details
      this.logger.error(
        `${errorContext.method} ${errorContext.path} - ${status}`,
        {
          ...errorContext,
          error: exception instanceof Error ? exception.stack : exception,
        },
      );
    }

    // Send user-friendly error response
    const errorResponse = {
      statusCode: status,
      message: this.sanitizeErrorMessage(message, status),
      timestamp: errorContext.timestamp,
      path: errorContext.path,
    };

    response.status(status).json(errorResponse);
  }

  private sanitizeErrorMessage(message: string, status: number): string {
    // In production, return generic messages for server errors
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      switch (status) {
        case HttpStatus.INTERNAL_SERVER_ERROR:
          return 'An unexpected error occurred. Please try again later.';
        case HttpStatus.BAD_GATEWAY:
          return 'Service temporarily unavailable. Please try again later.';
        case HttpStatus.SERVICE_UNAVAILABLE:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return 'An error occurred. Please try again later.';
      }
    }

    // For client errors (4xx) or development, return the actual message
    return message;
  }
}