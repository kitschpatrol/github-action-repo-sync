#!/bin/bash

STATUS=0

# remember last error code
trap 'STATUS=$?' ERR

# problem matcher must exist in workspace
cp /error-matcher.json $HOME/repo-sync-error-matcher.json
echo "::add-matcher::$HOME/repo-sync-error-matcher.json"

echo "Repository: [$GITHUB_REPOSITORY]"

# log inputs
echo "Inputs"
echo "---------------------------------------------"
REPO_TYPE="$INPUT_TYPE"
FILE_PATH="$INPUT_PATH"
GITHUB_TOKEN="$INPUT_TOKEN"
echo "Repo type    : $REPO_TYPE"
FILES=($RAW_FILES)
echo "Path         : $FILE_PATH"
GIT_EMAIL="$INPUT_GIT_EMAIL"
echo "Git email       : $GIT_EMAIL"
GIT_USERNAME="$INPUT_GIT_USERNAME"
echo "Git username    : $GIT_USERNAME"

# set temp path
TEMP_PATH="/ghars/"
cd /
mkdir "$TEMP_PATH"
cd "$TEMP_PATH"
echo "Temp Path       : $TEMP_PATH"
echo "---------------------------------------------"

echo " "

# find username and repo name
REPO_INFO=($(echo $GITHUB_REPOSITORY | tr "/" "\n"))
USERNAME=${REPO_INFO[0]}
echo "Username: [$USERNAME]"
REPO_NAME=${REPO_INFO[1]}
echo "Repo name: [$REPO_NAME]"

# initialize git
echo "Intiializing git"
git config --system core.longpaths true
git config --global core.longpaths true
git config --global user.email "$GIT_EMAIL" && git config --global user.name "$GIT_USERNAME"
echo "Git initialized"

echo " "

# clone the repo
REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
GIT_PATH="${TEMP_PATH}${GITHUB_REPOSITORY}"
echo "Cloning [$REPO_URL] to [$GIT_PATH]"
git clone --quiet --no-hardlinks --no-tags --depth 1 $REPO_URL ${GITHUB_REPOSITORY}

cd $GIT_PATH

# verify path exists
echo "Checking that [${FILE_PATH}] exists"
if [ ! -f "$FILE_PATH" ]; then
    echo "Path does not exist: [${FILE_PATH}]"
    exit 1
fi

# default the parameters
DESCRIPTION=""
WEBSITE=""
TOPICS=""

echo " "

echo "Repo type: ${REPO_TYPE}"

# determine repo type
if [ "$REPO_TYPE" == "npm" ]; then
    echo "Repo type: NPM"
    # read in the variables from package.json
    echo "Parsing ${FILE_PATH}"
    DESCRIPTION=$(jq -r '.description' ${FILE_PATH})
    WEBSITE=$(jq -r '.homepage' ${FILE_PATH})
    TOPICS=$(jq '.keywords' ${FILE_PATH})

elif [ "$REPO_TYPE" == "nuget" ]; then
    echo "Repo type: NuGet"
    DESCRIPTION=$(grep -oP '(?<=<Description>)[^<]+' "${FILE_PATH}")
    WEBSITE=$(grep -oP '(?<=<RepositoryUrl>)[^<]+' "${FILE_PATH}")
    TOPICS_STRING=$(grep -oP '(?<=<PackageTags>)[^<]+' "${FILE_PATH}")
    TOPICS_ARRAY=$(echo $TOPICS_STRING | tr ";" "\n")
    TOPICS=$(printf '%s\n' "${TOPICS_ARRAY[@]}" | jq -R . | jq -s .)

elif [ "$REPO_TYPE" == "python" ]; then
    echo "Repo type: Python"
    # read in the variables from pyproject.toml
    echo "Parsing ${FILE_PATH}"
    DESCRIPTION=$(yq e '.tool.poetry.description' ${FILE_PATH})
    WEBSITE=$(yq e '.tool.poetry.homepage' ${FILE_PATH})
    # yq responds with `null` if nothing exists, but we want to return an empty array
    TOPICS=$(
        result=$(yq -ojson eval '.tool.poetry.keywords' pyproject.toml)
        if [ "$result" = "null" ]; then
            echo "[]"
        else
            echo $result
        fi
    )
else
    echo "Unsupported repo type: [${REPO_TYPE}]"
    exit 1
fi

# update the description
echo " "
echo "Description: ${DESCRIPTION}"
if [ "$DESCRIPTION" != null -a "$DESCRIPTION" != "" ]; then
    echo "Updating description for [${GITHUB_REPOSITORY}]"
    jq -n --arg description "$DESCRIPTION" '{description:$description}'
    jq -n --arg description "$DESCRIPTION" '{description:$description}' | curl -d @- \
        -X PATCH \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Content-Type: application/json" \
        -u ${USERNAME}:${GITHUB_TOKEN} \
        --silent \
        ${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}
fi

# update the homepage
echo " "
echo "Website: ${WEBSITE}"

if [ "$WEBSITE" != null ] && [ "$WEBSITE" != "" ]; then
    if [[ "$WEBSITE" != https://github.com/* ]]; then
        echo "Updating homepage for [${GITHUB_REPOSITORY}]"
        jq -n --arg homepage "$WEBSITE" '{homepage:$homepage}' | curl -d @- \
            -X PATCH \
            -H "Accept: application/vnd.github.v3+json" \
            -H "Content-Type: application/json" \
            -u ${USERNAME}:${GITHUB_TOKEN} \
            --silent \
            ${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}
    else
        echo "Skipping update as the website is likely a reduntant link to the GitHub repo."
    fi
else
    echo "No website URL provided."
fi

# update the topics
echo " "
echo "Topics: ${TOPICS}"
if [ "$TOPICS" != null -a "$TOPICS" != "" ]; then
    echo "Updating topics for [${GITHUB_REPOSITORY}]"
    jq -n --argjson topics "$TOPICS" '{names:$topics}'
    jq -n --argjson topics "$TOPICS" '{names:$topics}' | curl -d @- \
        -X PUT \
        -H "Accept: application/vnd.github.mercy-preview+json" \
        -u ${USERNAME}:${GITHUB_TOKEN} \
        --silent \
        ${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/topics
fi

exit $STATUS
