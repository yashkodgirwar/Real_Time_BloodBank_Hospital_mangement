import sys
import json
import joblib
import pandas as pd
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

try:
    # Load model and columns relative to the script directory
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model = joblib.load(os.path.join(script_dir, 'campaign_model.pkl'))
    model_columns = joblib.load(os.path.join(script_dir, 'model_columns.pkl'))

    # Read input data from arguments
    # Ex: [{'Location': 'North Zone', 'Blood_Group': 'A+', 'Approved_Requests': 10, 'Pending_Requests': 30}, ...]
    input_data = sys.argv[1]
    data_list = json.loads(input_data)
    
    if len(data_list) == 0:
        print(json.dumps({"error": "No data provided"}))
        sys.exit(0)

    # Convert to DataFrame
    df = pd.DataFrame(data_list)
    
    # Store original for the final output
    original_df = df.copy()

    # Preprocess
    df_encoded = pd.get_dummies(df, columns=['Location', 'Blood_Group'])

    # Ensure all columns from training are present
    for col in model_columns:
        if col not in df_encoded.columns:
            df_encoded[col] = 0

    # Ensure feature order matches training
    X = df_encoded[model_columns]

    # Predict
    predictions = model.predict(X)
    original_df['Predicted_Units_Needed'] = predictions

    # Find the top recommendation
    best_campaign = original_df.sort_values(by='Predicted_Units_Needed', ascending=False).iloc[0]
    
    result = {
        "location": best_campaign['Location'],
        "blood_group": best_campaign['Blood_Group'],
        "units": int(best_campaign['Predicted_Units_Needed'])
    }
    
    # Return as JSON string
    print(json.dumps(result))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
