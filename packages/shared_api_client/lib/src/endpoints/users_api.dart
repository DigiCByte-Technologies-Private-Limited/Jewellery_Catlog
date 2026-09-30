import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/user_model.dart';

part 'users_api.g.dart';

@RestApi()
abstract class UsersApi {
  factory UsersApi(Dio dio, {String baseUrl}) = _UsersApi;

  @GET('/users/me')
  Future<UserModel> getProfile();

  @GET('/users')
  Future<List<UserModel>> getUsers();

  @PATCH('/users/{id}')
  Future<UserModel> updateUser(
    @Path('id') String id,
    @Body() Map<String, dynamic> data,
  );
}
