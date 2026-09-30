import 'package:dio/dio.dart';
import 'token_storage.dart';

/// Configures and creates the centralized Dio client instance with interceptors.
class DioClient {
  final TokenStorage tokenStorage;
  late final Dio dio;

  DioClient({
    required String baseUrl,
    TokenStorage? tokenStorage,
  }) : tokenStorage = tokenStorage ?? TokenStorage() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await this.tokenStorage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // Centralized error handling / token refresh hook
          return handler.next(error);
        },
      ),
    );
  }
}
