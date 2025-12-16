import mysql.connector
from mysql.connector import Error

class MySQLDatabase:
    def __init__(self):
        self.host = "localhost"
        self.database = "tugaspwt-smt3" 
        self.user = "root"
        self.password = ""  
        
    def get_connection(self):
        try:
            connection = mysql.connector.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password
            )
            if connection.is_connected():
                print("✅ Connected to MySQL database")
                return connection
        except Error as e:
            print(f"❌ Error connecting to MySQL: {e}")
            return None

    def check_user_exists(self, username, email):
        connection = self.get_connection()
        if connection:
            try:
                cursor = connection.cursor()
                cursor.execute("SELECT id FROM customers WHERE username = %s", (username,))
                if cursor.fetchone():
                    return "username"
                cursor.execute("SELECT id FROM customers WHERE email = %s", (email,))
                if cursor.fetchone():
                    return "email"
                    
                return None
            except Error as e:
                print(f"❌ Database error: {e}")
                return "error"
            finally:
                if cursor:
                    cursor.close()
                if connection:
                    connection.close()
        return "connection_error"

    def register_user(self, user_data):
        connection = self.get_connection()
        if connection:
            try:
                cursor = connection.cursor()
                query = """
                INSERT INTO customers (username, password, email, phone) 
                VALUES (%s, %s, %s, %s)
                """
                values = (
                    user_data['username'],
                    user_data['password'],
                    user_data['email'],
                    user_data['phone']
                )
                
                cursor.execute(query, values)
                connection.commit()
                
                print(f"✅ User {user_data['username']} registered successfully")
                return True
            except Error as e:
                print(f"❌ Error registering user: {e}")
                return False
            finally:
                if cursor:
                    cursor.close()
                if connection:
                    connection.close()
        return False

    def login_user(self, username, password):
        connection = self.get_connection()
        if connection:
            try:
                cursor = connection.cursor(dictionary=True)
                query = "SELECT id, username, email, phone FROM customers WHERE username = %s AND password = %s"
                cursor.execute(query, (username, password))
                user = cursor.fetchone()
                
                if user:
                    print(f"✅ User {username} logged in successfully")
                    return user
                else:
                    return None
            except Error as e:
                print(f"❌ Error during login: {e}")
                return None
            finally:
                if cursor:
                    cursor.close()
                if connection:
                    connection.close()
        return None

    # Test connection
    def test_connection(self):
        connection = self.get_connection()
        if connection:
            try:
                cursor = connection.cursor()
                cursor.execute("SELECT DATABASE()")
                db_name = cursor.fetchone()
                print(f"✅ Connected to database: {db_name[0]}")
                
                cursor.execute("SHOW TABLES LIKE 'customers'")
                table_exists = cursor.fetchone()
                if table_exists:
                    print("✅ Table 'customers' exists")
                else:
                    print("❌ Table 'customers' does not exist")
                    
                return True
            except Error as e:
                print(f"❌ Test connection failed: {e}")
                return False
            finally:
                if cursor:
                    cursor.close()
                if connection:
                    connection.close()
        return False