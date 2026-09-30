import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/auth_response.dart';

part 'auth_api.g.dart';

@RestApi()
abstract class AuthApi {
  factory AuthApi(Dio dio, {String baseUrl}) = _AuthApi;

  @POST('/auth/login')
  Future<AuthResponse> login(@Body() Map<String, dynamic> credentials);

  @POST('/auth/register')
  Future<AuthResponse> register(@Body() Map<String, dynamic> payload);

  @POST('/auth/refresh')
  Future<AuthResponse> refreshToken(@Body() Map<String, dynamic> tokenPayload);
}
