package com.dbviewer;

import android.util.Log;
import java.util.Map;
import java.util.HashMap;
import java.util.Properties;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;

public class MySqlConnectorModule extends ReactContextBaseJavaModule {

  private Connection connection;

  MySqlConnectorModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "MySqlConnectorModule";
  }

  private String buildConnection(String host, Integer port, String database) {
    String connString = "jdbc:mysql://" + host;
    if (port != null)
      connString += ":" + port.toString();
    if (database != null)
      connString += "/" + database;
    return connString;
  }

  @ReactMethod
  public void connect(ReadableMap config, Promise promise) {
    String host = config.getString("host");
    Integer port = null;
    String user = config.getString("username");
    String password = config.getString("password");
    String database = null;

    if(config.hasKey("port") && !config.isNull("port"))
      port = config.getInt("port");
    if(config.hasKey("database") && !config.isNull("database"))
      database = config.getString("database");

    String build = buildConnection(host, port, database);
    Properties properties = new Properties();
    properties.setProperty("user", user);
    properties.setProperty("password", password);

    try {
      Class.forName("com.mysql.jdbc.Driver");
      this.connection = DriverManager.getConnection(
        build,
        properties
      );
      promise.resolve(null);
    } catch(Exception e) {
      promise.reject("500", e.getMessage(), e);
    }
  }

  @ReactMethod
  public void execute(String query, Promise promise) {
    try {
      Statement statement = connection.createStatement();
      Boolean result = statement.execute(query);
      if (result) {
        try {
          WritableArray results = prepareResultSet(statement.getResultSet());
          promise.resolve(results);
        } catch (Exception e) {
          promise.reject("500", e.getMessage(), e);
        }
      } else {
        int affectedRows = statement.getUpdateCount();
        promise.resolve(affectedRows);
      }
      // else
      //   promise.resolve(null);
    } catch (Exception e) {
      promise.reject("500", e.getMessage(), e);
    }
  }

  @ReactMethod
  public void executeQuery(String query, Promise promise) {
    try {
      Statement statement = connection.createStatement();
      ResultSet resultSet = statement.executeQuery(query);
      try {
        WritableArray results = prepareResultSet(resultSet);
        promise.resolve(results);
      } catch (Exception e) {
        promise.reject("500", e.getMessage(), e);
      }
    } catch (Exception e) {
      promise.reject("500", e.getMessage(), e);
    }
  }

  @ReactMethod
  public void executeUpdate(String query, Promise promise) {
    try {
      Statement statement = connection.createStatement();
      int affectedRows = statement.executeUpdate(query);
      promise.resolve(affectedRows);
    } catch (Exception e) {
      promise.reject("500", e.getMessage(), e);
    }
  }

  private WritableArray prepareResultSet(ResultSet resultSet) throws Exception {
    ResultSetMetaData metaData = resultSet.getMetaData();
    int numOfColumns = metaData.getColumnCount();
    WritableArray results = Arguments.createArray();

    while (resultSet.next()) {
      WritableMap writableMap = Arguments.createMap();

      for (int i = 1; i <= numOfColumns; i++) {
        Object currentObj = resultSet.getObject(i);
        String currentColumnName = metaData.getColumnName(i);

        if (currentObj == null) {
          writableMap.putNull(currentColumnName);
        } else if (currentObj instanceof Integer) {
          writableMap.putInt(currentColumnName, (Integer) currentObj);
        } else if (currentObj instanceof Boolean) {
          writableMap.putBoolean(currentColumnName, (Boolean) currentObj);
        } else if (currentObj instanceof Double) {
          writableMap.putDouble(currentColumnName, (Double) currentObj);
        } else if (currentObj instanceof String) {
          writableMap.putString(currentColumnName, (String) currentObj);
        } else {
          writableMap.putString(currentColumnName, String.valueOf(currentObj));
        }
      }
      results.pushMap(writableMap);
    }
    return results;
  }

  @ReactMethod
  public void close(Promise promise) {
    if (connection == null) {
      promise.reject("404", "No open connection");
      return;
    }
    try {
      connection.close();
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("500", "Error when close connection " + e.getMessage(), e);
    }
  }

}